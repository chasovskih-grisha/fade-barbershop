import { HomeVelvetCrestMasteryPromo } from './HomeVelvetCrestMasteryPromo';
import { HomeObsidianCrownGroomingPromo } from './HomeObsidianCrownGroomingPromo';
import { HomeStylePassportPromo } from './HomeStylePassportPromo';
import { HomeRoyalEssenceVaultPromo } from './HomeRoyalEssenceVaultPromo';
import { HomeExclusiveBeardSpaPromo } from './HomeExclusiveBeardSpaPromo';
import { HomeMasterclassMasteryPromo } from './HomeMasterclassMasteryPromo';
import { HomePrestigeConciergeClubPromo } from './HomePrestigeConciergeClubPromo';
import { HomeExecutiveAuraElitePromo } from './HomeExecutiveAuraElitePromo';

/** Exclusive collections, masterclasses and club programmes. */
export function HomeSignatureShowcase() {
  return (
    <section className="flex flex-col gap-8 py-4">
      <div className="flex flex-col gap-2 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-pill bg-semantic-warning/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-semantic-warning w-fit">
          <span>✨ Ексклюзивні колекції та майстер-класи</span>
        </div>
        <h2 className="font-display text-h3 md:text-h2 font-bold text-fg">
          Приватні ритуали, преміум пакети та клубні програми
        </h2>
        <p className="text-bodyLg text-fg-secondary">
          Оберіть персональний формат догляду вищого рівня з гарантією форми, гарячими рушниками та
          затишною атмосферою студії.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <HomeVelvetCrestMasteryPromo />
        <HomeObsidianCrownGroomingPromo />
        <HomeStylePassportPromo />
        <HomeRoyalEssenceVaultPromo />
        <HomeExclusiveBeardSpaPromo />
        <HomeMasterclassMasteryPromo />
        <HomePrestigeConciergeClubPromo />
        <HomeExecutiveAuraElitePromo />
      </div>
    </section>
  );
}
