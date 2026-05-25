variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "truehire"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "vpc_id" {
  type        = string
  description = "Existing VPC ID for EC2 and RDS."
}

variable "public_subnet_id" {
  type        = string
  description = "Public subnet ID for the EC2 instance."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "At least two private subnet IDs for the RDS subnet group."
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "CIDR allowed to SSH into EC2, for example your-ip/32."
}

variable "key_name" {
  type        = string
  description = "Existing EC2 key pair name."
}

variable "ami_id" {
  type        = string
  description = "Ubuntu 22.04/24.04 AMI ID for the selected AWS region."
}

variable "ec2_instance_type" {
  type    = string
  default = "t3.micro"
}

variable "db_username" {
  type    = string
  default = "truehire_admin"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Strong RDS password."
}

variable "db_name" {
  type    = string
  default = "truehire"
}

