import jwt from 'jsonwebtoken';

const randomNames = [
    'Jack',
    'Lukas',
    'James',
    'Oliver',
    'Sophia',
    'Emma',
    'Aria',
    'Amelia'
];

/*
 * getUserInformation - extract user information from JWT(JSON Web Token)
 *  this function returns an object that has two keys:
 *  {
 *      username: user's nickname for chat. either SPARCS nickname or random
 *      isAdmin: boolean value indicating whether this user is admin
 *  }
 */
export const getUserInformation = token => {
    try {
        const { sparcs_id, isAdmin } = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        return { username: sparcs_id, isAdmin };
    } catch (err) {
        return {
            username:
                randomNames[Math.floor(Math.random() * randomNames.length)],
            isAdmin: false
        };
    }
};

/*
 * getConnectedMembers - get member names that are currently connected to the server socket.
 *  this function returns an array of strings
 */
export const getConnectedMembers = accessors =>
    Object.keys(accessors).filter(user => accessors[user] > 0);
