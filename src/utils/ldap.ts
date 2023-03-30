import { Client } from 'ldapts';

const client = new Client({
  url: 'ldap://ldap.sparcs.org',
  timeout: 0,
  connectTimeout: 2000,
  strictDN: true,
});

/**
 * Sanitize a string to be used in LDAP queries
 * Allows only alphabets and converts to lowercase
 * @param str
 */
const sanitize = (str: string) =>
  /^[A-Za-z]+$/.test(str) ? str.toLowerCase() : '';

/**
 * Authenticate a user with LDAP
 * @param username
 * @param password
 */
export const authenticate = async (
  username: string,
  password: string
): Promise<string | null> => {
  try {
    await client.bind(
      `uid=${sanitize(username)},ou=People,dc=sparcs,dc=org`,
      password
    );
  } catch {
    return null;
  } finally {
    await client.unbind();
  }

  return username;
};
