import { db } from ".";
import { agentType, cloudProvider, image, type NewAgentType, type NewCloudProvider } from "./schema/cloud";


const newCloudProviders: NewCloudProvider[] = [
    {
        name: "Railway",
    },
    {
        name: "AWS",
    },
]

const newAgentTypes: NewAgentType[] = [
    {
        name: "OpenCode",
    },
    {
        name: "Codex"
    },
    {
        name: "ClaudeCode",
    },
]

async function seedDB() {

    await db.insert(cloudProvider).values(newCloudProviders).returning();

    const agents = await db.insert(agentType).values(newAgentTypes).returning();

    await db.insert(image).values([
        {
            name: "gitpad-opencode",
            imageId: "opeoginni/gitpad-opencode",
            agentTypeId: agents[0]?.id ?? "",
        }
    ])

}

seedDB().then(() => {
    console.log("DB seeded successfully");
    process.exit(0);
}).catch((error) => {
    console.error("Error seeding DB", error);
    process.exit(1);
})

// yarn db:seed