import os
import glob

packages_dir = "/Users/grisha/Projects/barbershop/platform/packages"
for root, dirs, files in os.walk(packages_dir):
    # skip node_modules and dist
    if "node_modules" in root or "dist" in root:
        continue
    for file in files:
        if file.endswith(('.js', '.d.ts')) and not file.endswith('.config.js'):
            # check if corresponding .ts exists
            base = file[:-5] if file.endswith('.d.ts') else file[:-3]
            ts_path = os.path.join(root, base + '.ts')
            tsx_path = os.path.join(root, base + '.tsx')
            if os.path.exists(ts_path) or os.path.exists(tsx_path):
                target_path = os.path.join(root, file)
                print(f"Removing stale artifact in source/root: {target_path}")
                os.remove(target_path)
print("Cleanup completed.")
