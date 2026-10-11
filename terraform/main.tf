terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------------
# Data Sources
# ------------------------------------------------------------------
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ------------------------------------------------------------------
# IAM Role for AWS Systems Manager (SSM) Access
# ------------------------------------------------------------------
resource "aws_iam_role" "breatheroute_ssm" {
  name        = "breatheroute-ec2-ssm-role"
  description = "Allows BreatheRoute EC2 instance to be managed by AWS Systems Manager"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "breatheroute-ec2-ssm-role"
    Project     = "BreatheRoute"
    Environment = "demo"
  }
}

resource "aws_iam_role_policy_attachment" "breatheroute_ssm" {
  role       = aws_iam_role.breatheroute_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "breatheroute_ssm" {
  name = "breatheroute-ec2-ssm-profile"
  role = aws_iam_role.breatheroute_ssm.name
}

# ------------------------------------------------------------------
# Least-privilege IAM Policy for DynamoDB and SSM Parameter Store
# ------------------------------------------------------------------
resource "aws_iam_policy" "breatheroute_app_policy" {
  name        = "breatheroute-ec2-app-policy"
  description = "Allows BreatheRoute EC2 backend to read existing DynamoDB table and SSM secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBReadAqiGrid"
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:*:table/breatheroute-aqi"
      },
      {
        Sid    = "SSMGetSecrets"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/breatheroute/*"
      }
    ]
  })

  tags = {
    Name        = "breatheroute-ec2-app-policy"
    Project     = "BreatheRoute"
    Environment = "demo"
  }
}

resource "aws_iam_role_policy_attachment" "breatheroute_app_policy" {
  role       = aws_iam_role.breatheroute_ssm.name
  policy_arn = aws_iam_policy.breatheroute_app_policy.arn
}

resource "aws_ssm_parameter" "gemini_api_key" {
  count       = var.gemini_api_key != "" ? 1 : 0
  name        = "/breatheroute/gemini_api_key"
  description = "Google Gemini API key for BreatheRoute Aegis AI"
  type        = "SecureString"
  value       = var.gemini_api_key

  tags = {
    Name        = "breatheroute-gemini-key"
    Project     = "BreatheRoute"
    Environment = "demo"
  }
}

# ------------------------------------------------------------------
# Security Group
# ------------------------------------------------------------------
resource "aws_security_group" "breatheroute" {
  name        = "breatheroute-ec2-sg"
  description = "Security group for BreatheRoute web application"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP web traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS web traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.admin_ssh_cidr != null && var.admin_ssh_cidr != "" ? [var.admin_ssh_cidr] : []
    content {
      description = "SSH administration (optional - AWS SSM works without open ports)"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "breatheroute-ec2-sg"
    Project     = "BreatheRoute"
    Environment = "demo"
  }
}

# ------------------------------------------------------------------
# EC2 Instance
# ------------------------------------------------------------------
resource "aws_instance" "breatheroute" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = element(tolist(data.aws_subnets.default.ids), 0)
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.breatheroute_ssm.name

  vpc_security_group_ids = [aws_security_group.breatheroute.id]
  key_name               = var.ssh_key_name != "" && var.ssh_key_name != null ? var.ssh_key_name : null

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    git_repo_url = var.git_repo_url
    git_branch   = var.git_branch
    aws_region   = var.aws_region
  })

  tags = {
    Name        = "breatheroute-demo"
    Project     = "BreatheRoute"
    Environment = "demo"
  }
}
