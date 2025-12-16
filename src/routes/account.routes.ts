import { Router } from 'express';
import {
  getAllAccounts,
  makeAdmin,
  makeClient,
} from '../controllers/account.controller';

const accountRoutes = Router();

// GET /allAccounts
accountRoutes.get('/allAccounts', getAllAccounts);
accountRoutes.get('/makeadmin/:email', makeAdmin);
accountRoutes.get('/makeclient/:email', makeClient);

export default accountRoutes;
