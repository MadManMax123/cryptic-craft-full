# Set your project directory
$dir = "C:\Users\satya\OneDrive\cluehuntNULL\support files\homepage\cryptic-craft"

# Check if directory exists
if (!(Test-Path $dir)) {
    Write-Host "Directory does not exist." -ForegroundColor Red
    exit
}

# Navigate to directory
Set-Location "$dir"

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login (if needed)
Write-Host "Logging into Vercel..." -ForegroundColor Cyan
vercel login

# Initialize / link project
Write-Host "Initializing Vercel project..." -ForegroundColor Cyan
vercel

# Add environment variable
Write-Host "Setting environment variable PORTAL_URL..." -ForegroundColor Cyan
echo "https://launchlevel.vercel.app" | vercel env add PORTAL_URL production

Write-Host "All set 🚀" -ForegroundColor Green