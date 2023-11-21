
import taskModel from "../models/taskModel.js";
import userModel from "../models/userModel.js";
import { createTransport } from 'nodemailer';
import dotenv from "dotenv";
import cron from "node-cron";

dotenv.config();

// Function to send email
const sendMail = (email, subject, title, description) => {
    var transporter = createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD
        }
    });

    var mailOptions = {
        from: 'taskmaster.mern@gmail.com',
        to: email,
        subject: subject,
        html: `<h1>${subject}</h1><h2>Title: ${title}</h2><h3>Description: ${description}</h3>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

// Function to check and send email notifications for approaching due tasks
const checkDueTasks = async () => {
    const approachingDueTasks = await taskModel.find({
        datetime: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 10 * 60 * 1000)
        },
        completed: false
    });

    approachingDueTasks.forEach(async (task) => {
        // Check if the reminder has already been sent
        if (!task.reminderSent) {
            const user = await userModel.findById(task.userId);
            sendMail(user.email, "Task Due Soon", task.title, task.description);

            // Update the task to indicate that a reminder has been sent
            await taskModel.findByIdAndUpdate(task._id, { reminderSent: true });
        }
    });
};

// Schedule the job to run every minute (adjust the cron schedule as needed)
cron.schedule('* * * * *', () => {
    console.log('Running task due time check job...');
    checkDueTasks();
});

const addTask = async (req, res) => {
    const { title, description, datetime } = req.body;
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    const newTask = new taskModel({ title, description, datetime, completed: false, userId });

    newTask.save()
        .then(() => {
            // Send email notification for the added task
            sendMail(user.email, "Task Added", title, description);
            return res.status(200).json({ message: "Task added successfully" });
        })
        .catch((error) => {
            return res.status(500).json({ message: error.message });
        });
};

const removeTask = (req, res) => {
    const { id } = req.params;
    console.log("Removing task with ID:", id);

    taskModel.findByIdAndDelete(id)
        .then(() => {
            console.log("Task deleted successfully");
            res.status(200).json({ message: "Task deleted successfully" });
        })
        .catch((error) => {
            console.error("Error deleting task:", error);
            res.status(501).json({ message: error.message });
        });
};

const updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, datetime, completed } = req.body;

    try {
        const updatedTask = await taskModel.findByIdAndUpdate(
            id,
            { title, description, datetime, completed },
            { new: true }
        );

        res.json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getTask = (req, res) => {
    taskModel.find({ userId: req.user.id })
        .then((data) => res.status(200).json(data))
        .catch((error) => res.status(501).json({ message: error.message }));
}

export { addTask, getTask, removeTask, updateTask };



