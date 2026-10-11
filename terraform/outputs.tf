output "instance_id" {
  description = "ID of the deployed EC2 instance"
  value       = aws_instance.breatheroute.id
}

output "instance_public_ip" {
  description = "Public IPv4 address of the EC2 instance"
  value       = aws_instance.breatheroute.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.breatheroute.public_dns
}

output "app_url" {
  description = "Direct URL to access BreatheRoute web application"
  value       = "http://${aws_instance.breatheroute.public_ip}"
}

output "api_health_url" {
  description = "Direct URL to verify backend API health"
  value       = "http://${aws_instance.breatheroute.public_ip}/api/health"
}

output "delhi_aqi_url" {
  description = "Direct URL to query the DynamoDB Delhi AQI grid from the EC2 instance"
  value       = "http://${aws_instance.breatheroute.public_ip}/api/aqi?region=delhi"
}
