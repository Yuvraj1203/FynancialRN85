const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'scripts', 'assets', 'MaterialDesignIcons.ttf');
const destination = path.join(
  root,
  'node_modules',
  '@react-native-vector-icons',
  'material-design-icons',
  'fonts',
  'MaterialDesignIcons.ttf',
);

if (!fs.existsSync(source)) {
  throw new Error(`Missing source font: ${source}`);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);

console.log('Restored @react-native-vector-icons/material-design-icons font asset.');
