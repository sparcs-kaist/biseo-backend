import mongoose from 'mongoose'

const adminSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    }
}, {
    collection: 'admins'
})

export default mongoose.model('Admin', adminSchema)
