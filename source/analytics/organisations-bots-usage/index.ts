import Logger from "@adaptly/logging/logger";
import { BotsUsageOrganisation, getBotsUsage } from "./bots-usage";
import { getOrganizationInfo } from "./organisation-info";

const mostStarredOrganisations = ['supabase'];

const organisationSpecific: string = '';


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

const organisations = !!organisationSpecific ? [organisationSpecific] : mostStarredOrganisations;

getOrganisationsBotsUsage(organisations).then((organisationsBotsUsage) => {
    organisationsBotsUsage.forEach(organisation => {
        Logger.debug(`"${organisation.name}" organisation bots usage`, organisation);
    });
});