const express = require('express');
const router = express.Router();

// Get the database reference from app.locals
const getDb = (req) => req.app.locals.db;

// Route to upload a file for a specific course
router.post('/:courseName/files', async (req, res) => {
    try {
        const { url, fileName, tags, uploaderName } = req.body;
        const courseName = req.params.courseName;

        if (!url || !fileName || !tags || !uploaderName) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const db = getDb(req);
        const coursesCollection = db.collection('courses');

        let course = await coursesCollection.findOne({ courseName });
        if (!course) {
            course = { courseName, files: [] };
        }

        course.files.push({ url, fileName, tags, uploaderName });
        await coursesCollection.updateOne(
            { courseName },
            { $set: { files: course.files } },
            { upsert: true }
        );

        res.status(201).json({ message: 'File uploaded successfully', file: course.files[course.files.length - 1] });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ error: 'Error uploading file', details: err.message });
    }
});

// Route to delete a file by courseName and fileName
router.delete('/:courseName/files/:fileName', async (req, res) => {
    try {
        const { courseName, fileName } = req.params;

        const db = getDb(req);
        const coursesCollection = db.collection('courses');

        const course = await coursesCollection.findOne({ courseName });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const updatedFiles = course.files.filter(file => file.fileName !== fileName);
        if (updatedFiles.length === course.files.length) {
            return res.status(404).json({ message: 'File not found' });
        }

        await coursesCollection.updateOne(
            { courseName },
            { $set: { files: updatedFiles } }
        );

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ error: 'Error deleting file', details: err.message });
    }
});

// Route to update a file by courseName and fileName
router.put('/:courseName/files/:fileName', async (req, res) => {
    try {
        const { courseName, fileName } = req.params;
        const { url, tags } = req.body;

        const db = getDb(req);
        const coursesCollection = db.collection('courses');

        const course = await coursesCollection.findOne({ courseName });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const file = course.files.find(f => f.fileName === fileName);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.url = url || file.url;
        file.tags = tags || file.tags;

        await coursesCollection.updateOne(
            { courseName },
            { $set: { files: course.files } }
        );

        res.status(200).json({ message: 'File updated successfully', file });
    } catch (err) {
        console.error('Error updating file:', err);
        res.status(500).json({ error: 'Error updating file', details: err.message });
    }
});

// Route to search files by tag
router.get('/:courseName/files/search', async (req, res) => {
    try {
        const { courseName } = req.params;
        const { tag } = req.query;

        const db = getDb(req);
        const coursesCollection = db.collection('courses');

        const course = await coursesCollection.findOne({ courseName });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const filteredFiles = course.files.filter(file => file.tags.includes(tag));
        if (filteredFiles.length === 0) {
            return res.status(404).json({ message: 'No files found with this tag' });
        }

        res.status(200).json(filteredFiles);
    } catch (err) {
        console.error('Error searching files:', err);
        res.status(500).json({ error: 'Error searching files', details: err.message });
    }
});

module.exports = router;
