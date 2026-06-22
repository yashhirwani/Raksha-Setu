# Helper script to locate a JDK 17 installation on Windows and optionally configure Gradle to use it
# Usage: Open PowerShell as the user who runs the build and run this script from project root.

$searchPaths = @(
  "$Env:ProgramFiles\Java",
  "$Env:ProgramFiles(x86)\Java",
  "$Env:LocalAppData\Programs\AdoptOpenJDK",
  "$Env:LocalAppData\Programs\Eclipse Adoptium",
  "C:\\ProgramData\\Oracle\\Java",
  "$Env:USERPROFILE\\jdk*",
  "$Env:USERPROFILE\\.sdkman\\candidates\\java"
)

Write-Host "Searching common locations for JDK 17..."
$found = $null
foreach ($p in $searchPaths) {
  try {
    $dirs = Get-ChildItem -Path $p -Directory -ErrorAction SilentlyContinue
    foreach ($d in $dirs) {
      if ($d.Name -match "17") {
        # crude check: folder name contains 17
        $bin = Join-Path $d.FullName 'bin\java.exe'
        if (Test-Path $bin) {
          $found = $d.FullName
          break
        }
      }
    }
    if ($found) { break }
  } catch { }
}

if (-not $found) {
  Write-Host "No JDK 17 found in common locations."
  Write-Host "Options:"
  Write-Host "  1) Install Temurin/OpenJDK 17 (recommended)."
  Write-Host "     - Chocolatey: choco install temurin17 -y  # requires admin"
  Write-Host "     - Scoop: scoop install openjdk17"
  Write-Host "     - Or download: https://adoptium.net/"
  Write-Host "  2) If you install elsewhere, rerun this script or set JAVA_HOME and retry."
  exit 1
}

Write-Host "Found candidate JDK 17 at: $found"

# Confirm user wants to set org.gradle.java.home
$resp = Read-Host "Set this path in android/gradle.properties as org.gradle.java.home? (Y/n)"
if ($resp -eq "n" -or $resp -eq "N") {
  Write-Host "Aborting configuration. You can set org.gradle.java.home manually."
  exit 0
}

$propFile = Join-Path $PSScriptRoot '..\android\gradle.properties' -Resolve
if (-not (Test-Path $propFile)) {
  Write-Host "gradle.properties not found at: $propFile"
  exit 1
}

$contents = Get-Content $propFile
# remove existing org.gradle.java.home if present
$contents = $contents | Where-Object { $_ -notmatch '^\s*org.gradle.java.home\s*=' }
$javaHomeEscaped = $found -replace '\\','\\\\'
$contents += "`norg.gradle.java.home=$javaHomeEscaped"
Set-Content -Path $propFile -Value $contents -Encoding UTF8
Write-Host "Updated $propFile with org.gradle.java.home=$found"
Write-Host "You can now run: cd android; .\gradlew assembleDebug"