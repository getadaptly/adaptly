import Logger from "@adaptly/logging/logger";
import { BotsUsageOrganisation, getBotsUsage } from "./bots-usage";
import { getOrganizationInfo } from "./organisation-info";

const organisations = ['supabase'];


async function getOrganisationsBotsUsage(organisations: string[]): Promise<BotsUsageOrganisation[]> {
    const organisationsBotsUsage: BotsUsageOrganisation[] = [];

    for (let organisation of organisations) {
        const organizationInfo = await getOrganizationInfo(organisation);
        const usage = getBotsUsage(organizationInfo);

        organisationsBotsUsage.push(usage);
    }

    return organisationsBotsUsage.sort((a, b) => {
        const avgAMerged = (a.renovate.prsMergedPerMonthLastYear + a.dependabot.prsMergedPerMonthLastYear) / 2;
        const avgBMerged = (b.renovate.prsMergedPerMonthLastYear + b.dependabot.prsMergedPerMonthLastYear) / 2;
    
        return avgBMerged - avgAMerged;
      });;
}
 
getOrganisationsBotsUsage(organisations).then((organisationsBotsUsage) => {
    Logger.debug("organisationsBotsUsage", organisationsBotsUsage);
});