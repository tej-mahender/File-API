const exp=require('express')
const courseApp=exp.Router();
const expressAsyncHandler=require('express-async-handler')
const {db, ObjectId}=require('mongodb')

courseApp.use(exp.json())

// Get files by course name
courseApp.get('/:courseName/files', expressAsyncHandler(async (req, res, next) => {
    const { courseName } = req.params;
    const courses = req.app.get('courses'); // Assuming you have a 'courses' collection

    try {
        const course = await courses.findOne({ courseName });

        if (!course) {
            return res.status(404).send({ message: 'Course not found' });
        }  

        res.send(course.files);
    } catch (error) {
        next(error);
    }
}));


// Route to upload a file for a specific course
courseApp.post('/:courseName/files', expressAsyncHandler(async (req, res) => {
    try {
        const { url, fileName, tags, uploaderName,userId } = req.body;
        console.log(req.body); 
        const courseName = req.params.courseName;

        if (!url || !fileName || !tags || !uploaderName || !userId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // const db = getDb(req);
        const coursesCollection = req.app.get('courses');
        const usersCollection = req.app.get('users')

        let course = await coursesCollection.findOne({ courseName });
        if (!course) {
            course = { courseName, files: [] };
        }

        const newFile = { url, fileName, tags, uploaderName };
console.log(newFile);
        // Add the file to the course's files array
        course.files.push(newFile);
        await coursesCollection.updateOne(
            { courseName },
            { $set: { files: course.files } }, 
            { upsert: true }
        );

        // Update the user's uploads array
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $push: { uploads: newFile } }
        );

        res.status(201).json({ message: 'File uploaded successfully', file: course.files[course.files.length - 1] });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ error: 'Error uploading file', details: err.message });
    }
}));

module.exports = courseApp

// // Route to delete a file by courseName and fileName
// courseApp.delete('/:courseName/files/:fileName',expressAsyncHandler( async (req, res) => {
//     try {
//         const { courseName, fileName } = req.params;

//         const db = getDb(req);
//         const coursesCollection = db.collection('courses');

//         const course = await coursesCollection.findOne({ courseName });

//         if (!course) {
//             return res.status(404).json({ message: 'Course not found' });
//         }

//         const updatedFiles = course.files.filter(file => file.fileName !== fileName);
//         if (updatedFiles.length === course.files.length) {
//             return res.status(404).json({ message: 'File not found' });
//         }

//         await coursesCollection.updateOne(
//             { courseName },
//             { $set: { files: updatedFiles } }
//         );

//         res.status(200).json({ message: 'File deleted successfully' });
//     } catch (err) {
//         console.error('Error deleting file:', err);
//         res.status(500).json({ error: 'Error deleting file', details: err.message });
//     }
// }));

// // Route to update a file by courseName and fileName
// courseApp.put('/:courseName/files/:fileName', expressAsyncHandler(async (req, res) => {
//     try {
//         const { courseName, fileName } = req.params;
//         const { url, tags } = req.body;

//         const db = getDb(req);
//         const coursesCollection = db.collection('courses');

//         const course = await coursesCollection.findOne({ courseName });
//         if (!course) {
//             return res.status(404).json({ message: 'Course not found' });
//         }

//         const file = course.files.find(f => f.fileName === fileName);
//         if (!file) {
//             return res.status(404).json({ message: 'File not found' });
//         }

//         file.url = url || file.url;
//         file.tags = tags || file.tags;

//         await coursesCollection.updateOne(
//             { courseName },
//             { $set: { files: course.files } }
//         );

//         res.status(200).json({ message: 'File updated successfully', file });
//     } catch (err) {
//         console.error('Error updating file:', err);
//         res.status(500).json({ error: 'Error updating file', details: err.message });
//     }
// }));

// // Route to search files by tag
// courseApp.get('/:courseName/files/search', expressAsyncHandler(async (req, res) => {
//     try {
//         const { courseName } = req.params;
//         const { tag } = req.query;

//         const db = getDb(req);
//         const coursesCollection = db.collection('courses');

//         const course = await coursesCollection.findOne({ courseName });
//         if (!course) {
//             return res.status(404).json({ message: 'Course not found' });
//         }

//         const filteredFiles = course.files.filter(file => file.tags.includes(tag));
//         if (filteredFiles.length === 0) {
//             return res.status(404).json({ message: 'No files found with this tag' });
//         }

//         res.status(200).json(filteredFiles);
//     } catch (err) {
//         console.error('Error searching files:', err);
//         res.status(500).json({ error: 'Error searching files', details: err.message });
//     }
// }));

