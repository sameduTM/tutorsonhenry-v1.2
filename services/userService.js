const bcrypt = require('bcrypt');
const User = require('../models/user');
const { ProctoredExam, OnlineClass, OnlineExam, AtiModule } = require('../config/db');

const saltRounds = 10;

class UserService {
    static async createUser(userData) {
        const { name, email, phone, role, password, createdAt } = userData;

        // hash password before storing in database
        bcrypt.genSalt(saltRounds, (err, salt) => {
            bcrypt.hash(password, salt, (err, passwordHash) => {
                const addedUser = new User({
                    name,
                    email,
                    phone,
                    role,
                    password: passwordHash,
                    createdAt,
                });
                addedUser.save();
            });
        });
    };

    static async getUser(email, password) {
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new Error("Invalid email or password");
        }

        return user;
    }

    static async getAllServices() {
        const proctoredExams = await ProctoredExam.find({});
        const onlineExams = await OnlineExam.find({});
        const atiModules = await AtiModule.find({});
        const onlineClasses = await OnlineClass.find({});

        return {
            proctoredExams,
            onlineExams,
            atiModules,
            onlineClasses,
        }
    }
};

module.exports = UserService;
