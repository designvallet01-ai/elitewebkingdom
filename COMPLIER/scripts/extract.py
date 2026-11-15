import zipfile
import os
import shutil

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bin_dir = os.path.join(base_dir, 'bin')
zip_path = os.path.join(bin_dir, 'w64devkit.zip')
dest_dir = bin_dir

print(f"Opening archive: {zip_path}")
if not os.path.exists(zip_path):
    print("Zip file does not exist!")
    exit(1)

print(f"Extracting to: {dest_dir}")
with zipfile.ZipFile(zip_path, 'r') as z:
    z.extractall(dest_dir)

print("Extraction completed successfully!")

# Check if extracted as 'w64devkit' and rename to 'gcc'
w64devkit_dir = os.path.join(bin_dir, 'w64devkit')
gcc_dir = os.path.join(bin_dir, 'gcc')

if os.path.exists(w64devkit_dir):
    if os.path.exists(gcc_dir):
        shutil.rmtree(gcc_dir, ignore_errors=True)
    os.rename(w64devkit_dir, gcc_dir)
    print(f"Renamed {w64devkit_dir} -> {gcc_dir}")

gcc_exe = os.path.join(gcc_dir, 'bin', 'gcc.exe')
if os.path.exists(gcc_exe):
    print(f"Verified GCC executable: {gcc_exe}")
    # Remove the zip file to save space
    try:
        os.remove(zip_path)
        print("Removed temporary zip file.")
    except Exception as e:
        print(f"Could not remove zip file: {e}")
else:
    print(f"WARNING: gcc.exe not found at {gcc_exe}")
