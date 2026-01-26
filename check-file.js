const fs = require('fs');
const path = require('path');

// Replace this with the filename from your 404 error
const fileName = '1769425520481-942582377.jpeg'; 
const filePath = path.join(__dirname, 'uploads', fileName);

console.log(filePath);

console.log('--- File Accessibility Check ---');
console.log('Target Path:', filePath);

// 1. Check if the directory exists
const dirPath = path.join(__dirname, 'uploads');
if (fs.existsSync(dirPath)) {
    console.log('✅ Directory "uploads" exists.');
} else {
    console.log('❌ Directory "uploads" DOES NOT exist.');
}

// 2. Check if the specific file exists
fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
        console.error(`❌ File is not readable or does not exist: ${err.message}`);
    } else {
        console.log('✅ File exists and is readable by Node.js.');
        
        // 3. Check file size to ensure it's not a 0-byte file
        const stats = fs.statSync(filePath);
        console.log(`📊 File Size: ${(stats.size / 1024).toFixed(2)} KB`);
    }
});
