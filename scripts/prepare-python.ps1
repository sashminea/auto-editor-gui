# Builds build\python: an embedded Windows Python with numpy and av installed.
# electron-builder copies it to <install folder>\resources\python (see "extraResources" in package.json).
# Safe to re-run: it skips the work if build\python is already prepared. Use -Force to rebuild.
param([switch]$Force)

$ErrorActionPreference = 'Stop'

# ---- settings ---------------------------------------------------------------
$PythonVersion = '3.11.9'                        # embedded Python (must be 3.11.x to match the wheels below)
$Packages      = @('numpy==2.4.6', 'av==15.1.0') # the versions your dev machine runs; add more here if the smoke test asks for them
# -----------------------------------------------------------------------------

$root   = Split-Path -Parent $PSScriptRoot
$out    = Join-Path $root 'build\python'
$marker = Join-Path $out '.ready'

if ((Test-Path $marker) -and -not $Force) {
    Write-Host 'Embedded Python already prepared (run with -Force to rebuild).'
    exit 0
}

if (-not (Test-Path (Join-Path $root 'auto_editor\__main__.py'))) {
    throw "auto_editor\__main__.py not found in $root. Restore the Python source first (git checkout 6a3ae43c -- auto_editor)."
}

# 1. Download + unpack the embeddable Python
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out | Out-Null

$zip = Join-Path $env:TEMP "python-$PythonVersion-embed-amd64.zip"
$url = "https://www.python.org/ftp/python/$PythonVersion/python-$PythonVersion-embed-amd64.zip"
Write-Host "Downloading $url"
Invoke-WebRequest -Uri $url -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $out -Force

# 2. Patch python3xx._pth
#    - enable `import site` so installed packages are found
#    - add Lib\site-packages explicitly
#    - add ..\auto-editor (= resources\auto-editor, where your auto_editor folder is shipped)
#    Paths in a ._pth file are relative to the file itself.
$pth = Get-ChildItem -Path $out -Filter 'python*._pth' | Select-Object -First 1
if (-not $pth) { throw 'Could not find the python*._pth file in the embedded Python.' }
$lines = Get-Content $pth.FullName | ForEach-Object {
    if ($_ -match '^\s*#\s*import site') { 'import site' } else { $_ }
}
$lines += 'Lib\site-packages'
$lines += '..\auto-editor'
Set-Content -Path $pth.FullName -Value $lines -Encoding ascii

# 3. Install the dependencies for Windows x64 / Python 3.11, whatever Python is on this machine
$site = Join-Path $out 'Lib\site-packages'
New-Item -ItemType Directory -Path $site -Force | Out-Null
Write-Host "Installing: $($Packages -join ', ')"
& py -3 -m pip install --target $site --only-binary=:all: --platform win_amd64 --python-version 3.11 --implementation cp --abi cp311 --no-warn-script-location @Packages
if ($LASTEXITCODE -ne 0) { throw 'pip install failed.' }

# 4. Smoke test: can the embedded Python import everything and start auto_editor?
$py = Join-Path $out 'python.exe'
$rootPy = $root -replace '\\', '/'
$test = "import sys; sys.path.insert(0, r'$rootPy'); import av, numpy, auto_editor; print('av', av.__version__, '| numpy', numpy.__version__, '| auto_editor ok')"
& $py -c $test
if ($LASTEXITCODE -ne 0) { throw 'Smoke test failed: the embedded Python cannot import av, numpy or auto_editor. Read the error above.' }

& $py -c "import sys, runpy; sys.path.insert(0, r'$rootPy'); sys.argv = ['auto_editor', '--version']; runpy.run_module('auto_editor', run_name='__main__', alter_sys=True)"
if ($LASTEXITCODE -ne 0) { throw 'Smoke test failed: auto_editor --version did not run.' }

Set-Content -Path $marker -Value (Get-Date -Format o)
Write-Host 'Embedded Python is ready: build\python'