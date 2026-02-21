const fs = require('fs');
const path = require('path');

module.exports = (on, config) => {
  on('task', {
    getDownloadedFile(downloadsFolder) {
      const files = fs.readdirSync(downloadsFolder)
        .map(name => ({
          name,
          time: fs.statSync(path.join(downloadsFolder, name)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      return files[0].name;
    },
  });
};
