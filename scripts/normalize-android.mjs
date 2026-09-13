import { readFile, writeFile } from 'node:fs/promises';

const files = [
  'android/app/capacitor.build.gradle',
  'android/capacitor-cordova-android-plugins/build.gradle',
  'node_modules/@capacitor/android/capacitor/build.gradle'
];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const normalized = source.replaceAll('JavaVersion.VERSION_21', 'JavaVersion.VERSION_17');
  if (source !== normalized) await writeFile(file, normalized, 'utf8');
}
