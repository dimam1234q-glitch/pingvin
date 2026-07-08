import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import ratingsRouter from "./ratings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(ratingsRouter);

export default router;
