import { Router, type IRouter } from "express";
import earlyAccessRouter from "./early-access";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(earlyAccessRouter);

export default router;
