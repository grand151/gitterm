// import z from "zod";
// import { protectedProcedure, router } from "../index";
// import * as AWSService from "../service/aws";

// export const awsRouter = router({
// 	createInstance: protectedProcedure.input(
//         z.object({
//             serverTypeId: z.uuid(),
//         })
//     ).mutation(async ({ ctx, input }) => {
//         const { user } = ctx.session;

//         const { serverTypeId } = input;

//         const instanceId = await AWSService.createInstance(serverTypeId, user.id);

//         return {
//             instanceId,
//         };
//     }),
// 	privateData: protectedProcedure.query(({ ctx }) => {
// 		return {
// 			message: "This is private",
// 			user: ctx.session.user,
// 		};
// 	}),
// });
// export type AwsRouter = typeof awsRouter;
