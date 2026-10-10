# Run this script from the frontend folder in PowerShell.
# It backs up LandingOverview.jsx before applying the AQI-grid preview patch.
$ErrorActionPreference = 'Stop'
$file = Join-Path (Get-Location) 'src/pages/LandingOverview.jsx'
if (-not (Test-Path $file)) {
  throw "Cannot find src/pages/LandingOverview.jsx. Open a terminal in the frontend folder and run this script again."
}
$content = Get-Content -Raw -Path $file
$backup = "$file.bak"
Copy-Item $file $backup -Force

# 1. Store the actual grid cells as well as summary statistics.
$oldState = "  const [aqiStats, setAqiStats] = useState(null);"
$newState = "  const [aqiStats, setAqiStats] = useState(null);`r`n  const [aqiCells, setAqiCells] = useState([]);"
if (-not $content.Contains($oldState)) { throw 'Could not find the aqiStats state line. No changes were saved.' }
$content = $content.Replace($oldState, $newState)

# 2. Keep the returned grid in state.
$oldCells = "          const cells = data.cells;"
$newCells = "          const cells = data.cells;`r`n          setAqiCells(cells);"
if (-not $content.Contains($oldCells)) { throw 'Could not find the data.cells line. No changes were saved.' }
$content = $content.Replace($oldCells, $newCells)

# 3. Derive a real grid cell nearest the configured Delhi map center.
$oldRouteLine = "  const fastestRoute = routes.find((r) => r.isFastest) || routes[1] || routes[0] || null;"
$newRouteLine = @'
  const fastestRoute = routes.find((r) => r.isFastest) || routes[1] || routes[0] || null;

  // The hero illustration is decorative, not a georeferenced route. Use the
  // real API grid cell nearest the configured map center for its AQI preview.
  const previewAqiCell = aqiCells.length > 0
    ? aqiCells.reduce((nearest, cell) => {
        const center = config.mapCenter || [77.215, 28.625]; // [lng, lat]
        const distance = (Number(cell.lng) - center[0]) ** 2 + (Number(cell.lat) - center[1]) ** 2;
        if (!nearest || distance < nearest.distance) return { cell, distance };
        return nearest;
      }, null)?.cell
    : null;
  const previewAqi = Number.isFinite(Number(previewAqiCell?.aqi))
    ? Number(previewAqiCell.aqi)
    : null;
'@
if (-not $content.Contains($oldRouteLine)) { throw 'Could not find the fastestRoute line. No changes were saved.' }
$content = $content.Replace($oldRouteLine, $newRouteLine.TrimEnd())

# 4. Replace the fake fallback AQI numbers in the hero preview with the API-derived grid value.
$content = $content.Replace("AQI {recommendedRoute ? recommendedRoute.avgAqi : '42'}", "AQI {recommendedRoute ? recommendedRoute.avgAqi : (previewAqi ?? '—')}")
$content = $content.Replace("AQI {fastestRoute ? fastestRoute.avgAqi : '170'}", "AQI {fastestRoute ? fastestRoute.avgAqi : (previewAqi ?? '—')}")
$content = [regex]::Replace($content, "\{fastestRoute \? `\$\{fastestRoute\.avgAqi\} AQI` : '170 AQI'\}", '{fastestRoute ? `${fastestRoute.avgAqi} AQI` : `${previewAqi ?? ''—''} AQI`}')
$content = [regex]::Replace($content, "\{recommendedRoute \? `\$\{recommendedRoute\.avgAqi\} AQI` : '42 AQI'\}", '{recommendedRoute ? `${recommendedRoute.avgAqi} AQI` : `${previewAqi ?? ''—''} AQI`}')

Set-Content -Path $file -Value $content -Encoding utf8
Write-Host 'AQI preview patch applied.' -ForegroundColor Green
Write-Host "Backup saved as: $backup"
Write-Host 'Next run: npm run build'
