const https = require('https');
const fs = require('fs');
const path = require('path');

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function downloadAndConvertModel() {
  try {
    console.log('Downloading pre-converted model...');
    const modelDir = path.join(__dirname, '../assets/model');

    // Create directory if it doesn't exist
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }

    // Download model files
    const modelUrl =
      'https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v2/model.json';
    const weightsUrl =
      'https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v2/weights.bin';

    console.log('Downloading model.json...');
    await downloadFile(modelUrl, path.join(modelDir, 'model.json'));

    console.log('Downloading weights.bin...');
    await downloadFile(weightsUrl, path.join(modelDir, 'weights.bin'));

    // Create labels file
    const labels = [
      'person',
      'bicycle',
      'car',
      'motorcycle',
      'airplane',
      'bus',
      'train',
      'truck',
      'boat',
      'traffic light',
      'fire hydrant',
      'stop sign',
      'parking meter',
      'bench',
      'bird',
      'cat',
      'dog',
      'horse',
      'sheep',
      'cow',
      'elephant',
      'bear',
      'zebra',
      'giraffe',
      'backpack',
      'umbrella',
      'handbag',
      'tie',
      'suitcase',
      'frisbee',
      'skis',
      'snowboard',
      'sports ball',
      'kite',
      'baseball bat',
      'baseball glove',
      'skateboard',
      'surfboard',
      'tennis racket',
      'bottle',
      'wine glass',
      'cup',
      'fork',
      'knife',
      'spoon',
      'bowl',
      'banana',
      'apple',
      'sandwich',
      'orange',
      'broccoli',
      'carrot',
      'hot dog',
      'pizza',
      'donut',
      'cake',
      'chair',
      'couch',
      'potted plant',
      'bed',
      'dining table',
      'toilet',
      'tv',
      'laptop',
      'mouse',
      'remote',
      'keyboard',
      'cell phone',
      'microwave',
      'oven',
      'toaster',
      'sink',
      'refrigerator',
      'book',
      'clock',
      'vase',
      'scissors',
      'teddy bear',
      'hair drier',
      'toothbrush',
    ];

    fs.writeFileSync(
      path.join(modelDir, 'labels.json'),
      JSON.stringify(labels)
    );

    console.log('Model downloaded successfully!');
  } catch (error) {
    console.error('Error downloading model:', error);
  }
}

downloadAndConvertModel();
