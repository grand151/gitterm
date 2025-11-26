import { protectedProcedure, publicProcedure, router } from "../index";
import { railwayRouter } from "./railway";
import { workspaceRouter } from "./workspace";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	railway: railwayRouter,
	workspace: workspaceRouter,
});
export type AppRouter = typeof appRouter;
