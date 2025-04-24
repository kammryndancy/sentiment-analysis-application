#!/bin/bash

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Please install AWS CLI first."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS CLI is not configured. Please configure AWS CLI first."
    exit 1
fi

# Get current AWS region
AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    echo "Error: No AWS region configured. Please configure your AWS region."
    exit 1
fi

# Get current AWS profile
AWS_PROFILE=$(aws configure get profile)
if [ -z "$AWS_PROFILE" ]; then
    AWS_PROFILE="default"
fi

# Function to run AWS CLI commands with profile
run_aws() {
    aws --profile "$AWS_PROFILE" "$@"
}

# Create VPC and Subnets
echo "Creating VPC and Subnets..."
VPC_ID=$(run_aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
run_aws ec2 create-tags --resources "$VPC_ID" --tags Key=Name,Value=sentiment-analysis-vpc

# Create Subnets
SUBNET_PUBLIC=$(run_aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.0.1.0/24 --availability-zone "${AWS_REGION}a" --query 'Subnet.SubnetId' --output text)
SUBNET_PRIVATE=$(run_aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.0.2.0/24 --availability-zone "${AWS_REGION}b" --query 'Subnet.SubnetId' --output text)

# Create Security Groups
echo "Creating Security Groups..."
SG_ID=$(run_aws ec2 create-security-group --group-name sentiment-analysis-sg --description "Security group for sentiment analysis" --vpc-id "$VPC_ID" --query 'GroupId' --output text)
MONGODB_SG=$(run_aws ec2 create-security-group --group-name mongodb-sg --description "MongoDB security group" --vpc-id "$VPC_ID" --query 'GroupId' --output text)
REDIS_SG=$(run_aws ec2 create-security-group --group-name redis-sg --description "Redis security group" --vpc-id "$VPC_ID" --query 'GroupId' --output text)

# Configure Security Group Rules
run_aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0
run_aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0
run_aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0

# Create RDS Instance
echo "Creating RDS Instance..."
RDS_INSTANCE=$(run_aws rds create-db-instance \
    --db-instance-identifier sentiment-analysis-db \
    --db-instance-class db.t2.micro \
    --engine mongodb \
    --allocated-storage 20 \
    --master-username admin \
    --master-user-password "$(openssl rand -base64 32)" \
    --vpc-security-group-ids "$MONGODB_SG" \
    --db-subnet-group-name mongodb-subnet-group \
    --publicly-accessible \
    --query 'DBInstance.DBInstanceIdentifier' \
    --output text)

# Create Redis Instance
echo "Creating Redis Instance..."
REDIS_INSTANCE=$(run_aws elasticache create-cache-cluster \
    --cache-cluster-id sentiment-analysis-redis \
    --cache-node-type cache.t2.micro \
    --engine redis \
    --num-cache-nodes 1 \
    --security-group-ids "$REDIS_SG" \
    --query 'CacheCluster.CacheClusterId' \
    --output text)

# Create Elastic Beanstalk Application
echo "Creating Elastic Beanstalk Application..."
run_aws elasticbeanstalk create-application --application-name sentiment-analysis-app

# Create Elastic Beanstalk Environment
echo "Creating Elastic Beanstalk Environment..."
run_aws elasticbeanstalk create-environment \
    --application-name sentiment-analysis-app \
    --environment-name sentiment-analysis-env \
    --solution-stack-name "64bit Amazon Linux 2 v3.6.1 running Python 3.9" \
    --instance-type t2.micro \
    --tags Key=Name,Value=sentiment-analysis-env

# Deploy Application
echo "Deploying Application..."
run_aws elasticbeanstalk create-application-version \
    --application-name sentiment-analysis-app \
    --version-label v1.0.0 \
    --source-bundle S3Bucket="sentiment-analysis-deploy",S3Key="sentiment-analysis-app.zip"

run_aws elasticbeanstalk update-environment \
    --environment-name sentiment-analysis-env \
    --version-label v1.0.0

# Configure Auto Scaling
echo "Configuring Auto Scaling..."
run_aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name sentiment-analysis-asg \
    --launch-template LaunchTemplateId=$(run_aws ec2 create-launch-template --launch-template-name sentiment-analysis-template --version-description "v1" --launch-template-data "{"ImageId":"ami-0c55b159cbfafe1f0","InstanceType":"t2.micro"}" --query 'LaunchTemplate.LaunchTemplateId' --output text) \
    --min-size 1 \
    --max-size 3 \
    --vpc-zone-identifier "$SUBNET_PUBLIC" \
    --target-group-arns $(run_aws elbv2 create-target-group --name sentiment-analysis-tg --protocol HTTP --port 80 --vpc-id "$VPC_ID" --query 'TargetGroups[0].TargetGroupArn' --output text)

# Create CloudWatch Alarms
echo "Creating CloudWatch Alarms..."
run_aws cloudwatch put-metric-alarm \
    --alarm-name HighCPUUtilization \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=AutoScalingGroupName,Value=sentiment-analysis-asg \
    --evaluation-periods 2 \
    --alarm-actions $(run_aws sns create-topic --name sentiment-analysis-alarms --query 'TopicArn' --output text)

# Create SNS Topic for Notifications
echo "Creating SNS Topic for Notifications..."
SNS_TOPIC=$(run_aws sns create-topic --name sentiment-analysis-notifications --query 'TopicArn' --output text)

# Configure SNS Subscription
run_aws sns subscribe \
    --topic-arn "$SNS_TOPIC" \
    --protocol email \
    --notification-endpoint "admin@example.com"

# Create CloudFormation Stack
echo "Creating CloudFormation Stack..."
run_aws cloudformation create-stack \
    --stack-name sentiment-analysis-stack \
    --template-body file://cloudformation-template.yaml \
    --parameters ParameterKey=VpcId,ParameterValue="$VPC_ID" \
    ParameterKey=SubnetIds,ParameterValue="$SUBNET_PUBLIC,$SUBNET_PRIVATE" \
    ParameterKey=SecurityGroupId,ParameterValue="$SG_ID" \
    ParameterKey=MongodbSecurityGroupId,ParameterValue="$MONGODB_SG" \
    ParameterKey=RedisSecurityGroupId,ParameterValue="$REDIS_SG" \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=ApplicationVersion,ParameterValue=v1.0.0

# Wait for stack creation to complete
run_aws cloudformation wait stack-create-complete --stack-name sentiment-analysis-stack

# Output final status
echo "Deployment completed successfully!"
echo "Application URL: $(run_aws elasticbeanstalk describe-environments --environment-names sentiment-analysis-env --query 'Environments[0].CNAME' --output text)"
echo "RDS Endpoint: $(run_aws rds describe-db-instances --db-instance-identifier sentiment-analysis-db --query 'DBInstances[0].Endpoint.Address' --output text)"
echo "Redis Endpoint: $(run_aws elasticache describe-cache-clusters --cache-cluster-id sentiment-analysis-redis --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' --output text)"
