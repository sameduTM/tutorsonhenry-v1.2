const bcrypt = require('bcrypt');
const User = require('../models/user');
const { ProctoredExam, OnlineClass, OnlineExam, AtiModule } = require('../config/db');

const saltRounds = 10;

class UserService {
    static async createUser(userData) {
        const { name, email, phone, role, password } = userData;

        // 1. Generate salt and hash using await
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 2. Create user instance
        const addedUser = new User({
            name,
            email,
            phone,
            role,
            password: passwordHash,
        });

        // 3. Await the save and return the result
        return await addedUser.save();
    };

    static async getUser(email, password) {
        try {
            // find user by email
            const user = await User.findOne({ email });

            // if no user found, return null
            if (!user) {
                return null;
            }

            // check password
            const isMatch = await bcrypt.compare(password, user.password);

            // if password is wrong, return null
            if (!isMatch) {
                return null;
            }

            // return user if everything matches
            return user;
        } catch (err) {
            throw err;
        }
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
