import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { listUsersSchema, updateUserRoleSchema } from './admin.schema';
import { changeUserRole, getUsers, removeUser, statistics } from './admin.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/users', validate(listUsersSchema, 'query'), getUsers);
router.patch('/users/:id/role', validate(updateUserRoleSchema), changeUserRole);
router.delete('/users/:id', removeUser);
router.get('/statistics', statistics);

export default router;
