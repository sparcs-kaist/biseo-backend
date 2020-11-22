import mongoose from 'mongoose';

const voteSchema = mongoose.Schema(
    {
        expires: {
            type: Date,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        subtitle: {
            type: String,
            required: true
        },
        choices: {
            type: [String],
            required: true
        },
        submissions: {
            type: [
                {
                    username: String,
                    choice: String
                }
            ],
            default: []
        }
    },
    {
        collection: 'votes'
    }
);

export default mongoose.model('Vote', voteSchema);
