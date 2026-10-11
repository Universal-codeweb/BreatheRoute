variable "aws_region" {
  type        = string
  description = "AWS region for the BreatheRoute deployment"
  default     = "us-east-1"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type (demo / cost-conscious)"
  default     = "t3.micro"
}

variable "admin_ssh_cidr" {
  type        = string
  description = "Optional Admin IPv4 CIDR block allowed for SSH access (e.g. '203.0.113.19/32'). If null/empty, port 22 remains closed and secure access is handled via AWS SSM Session Manager."
  default     = null
}

variable "ssh_key_name" {
  type        = string
  description = "Optional name of an existing AWS Key Pair for SSH access"
  default     = null
}

variable "git_repo_url" {
  type        = string
  description = "Git repository URL to clone on the EC2 instance"
  default     = "https://github.com/Universal-codeweb/BreatheRoute.git"
}

variable "git_branch" {
  type        = string
  description = "Git branch to check out"
  default     = "main"
}

