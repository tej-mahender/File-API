const exp=require('express')
const courseApp=exp.Router();
const expressAsyncHandler=require('express-async-handler')
const {db}=require('mongodb')
courseApp.use(exp.json())

// Get files by course name
courseApp.get('/:courseName/files', expressAsyncHandler(async (req, res, next) => {
    const { courseName } = req.params;
    const courses = req.app.get('TestCourses'); // Assuming you have a 'courses' collection

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

module.exports = courseApp