import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { gameSessionsdata } from './data/resource.js';

defineBackend({
  auth,
  gameSessionsdata,
});
