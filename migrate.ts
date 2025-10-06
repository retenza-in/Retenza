import { db, loyaltyPrograms, missions } from "@/db";

throw new Error("done");

(async () => {
  const ms = await db.select().from(missions)

  for (const mission of ms) {
    await db.update(missions).set({
      filters: mission.filters ? (() => {
        const newFilters = {...mission.filters}
        
        newFilters.ageRange = mission.filters.age_range
        newFilters.customerType = mission.filters.customer_type
        delete newFilters.age_range
        delete newFilters.customer_type

        return newFilters
      })() : null
    })

    console.log("Updated mission", mission.id)
  }

  const lp = await db.select().from(loyaltyPrograms)
  
  for (const program of lp) {
    await db.update(loyaltyPrograms).set({
      tiers: program.tiers.map(t => {
        const newTier = {...t}

        newTier.pointsToUnlock = newTier.points_to_unlock
        delete newTier.points_to_unlock

        newTier.rewards = newTier.rewards.map(r => {
          const newReward = {...r}
          newReward.rewardType = newReward.reward_type
          newReward.rewardText = newReward.reward_text
          newReward.usageLimitPerMonth = newReward.usage_limit_per_month
          newReward.oneTime = newReward.one_time

          delete newReward.reward_type
          delete newReward.reward_text
          delete newReward.usage_limit_per_month
          delete newReward.one_time
          return newReward
        })

        return newTier
      })
    })

    console.log("Updated LP", program.id)
  }
})()