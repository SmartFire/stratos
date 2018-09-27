import { browser, promise } from 'protractor';

import { IOrganization, ISpace } from '../../frontend/app/core/cf-api.types';
import { APIResource } from '../../frontend/app/store/types/api.types';
import { ApplicationE2eHelper } from '../application/application-e2e-helpers';
import { e2e } from '../e2e';
import { E2EConfigCloudFoundry } from '../e2e.types';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../helpers/e2e-helpers';
import { ListComponent } from '../po/list.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationsPage } from './applications.po';


const customOrgSpacesLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER) + '-app-wall-tests';

describe('Application Wall Tests -', () => {

  let cfHelper: CFHelpers;
  let defaultCf: E2EConfigCloudFoundry;
  const appsPage = new ApplicationsPage();
  const appList = new ListComponent();
  let endpointGuid: string;
  let space1: APIResource<ISpace>;
  let space2: APIResource<ISpace>;
  let space1Apps: string[];
  let space2Apps: string[];
  let baseAppName: string;

  const timeAllowed = 60000;

  function createAppNames(count: number): string[] {
    const appNames = [];
    // Ensure the app names all have the same prefix
    baseAppName = ApplicationE2eHelper.createApplicationName(null, '-wallTest-');
    for (let i = 0; i < count; i++) {
      appNames.push(`${baseAppName}${i}`);
    }
    return appNames;
  }

  function chainCreateApp(spaceGuid: string, appNames: string[]): promise.Promise<any> {
    return appNames.reduce((promiseChain, name) => {
      return promiseChain.then(() => {
        // Ensure there's a gap so that the 'created_at' is different
        browser.sleep(1100);

        return cfHelper.basicCreateApp(endpointGuid, spaceGuid, name);
      });
    }, promise.fullyResolved(''));
  }

  function concurrentCreateApp(spaceGuid: string, appNames: string[]): promise.Promise<any> {
    return promise.all(appNames.map(name => cfHelper.basicCreateApp(endpointGuid, spaceGuid, name)));
  }

  function setup(orgName: string, appNames: string[], orderImportant: boolean) {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);

    browser.wait(
      cfHelper.addOrgIfMissingForEndpointUsers(endpointGuid, defaultCf, orgName, true)
        .then((org: APIResource<IOrganization>) => {
          const spaceName1 = E2EHelpers.createCustomName(customOrgSpacesLabel) + '-1';
          const spaceName2 = E2EHelpers.createCustomName(customOrgSpacesLabel) + '-2';
          return promise.all([
            cfHelper.addSpaceIfMissingForEndpointUsers(endpointGuid, org.metadata.guid, org.entity.name, spaceName1, defaultCf, true),
            cfHelper.addSpaceIfMissingForEndpointUsers(endpointGuid, org.metadata.guid, org.entity.name, spaceName2, defaultCf, true),
          ]);
        })
        .then(([s1, s2]) => {
          space1 = s1;
          space2 = s2;

          if (!appNames || !appNames.length) {
            return promise.fullyResolved(null);
          }

          if (appNames.length === 1) {
            return concurrentCreateApp(space1.metadata.guid, appNames);
          }

          const splitIndex = Math.round(appNames.length / 2) - 1;
          space1Apps = appNames.slice(0, splitIndex);
          space2Apps = appNames.slice(splitIndex, appNames.length);

          // Chain the creation of the spaces to ensure there's a nice sequential 'created_at' value to be used for sort tests
          const promises = orderImportant ?
            chainCreateApp(space1.metadata.guid, space1Apps).then(() => chainCreateApp(space2.metadata.guid, space2Apps)) :
            promise.all([concurrentCreateApp(space1.metadata.guid, space1Apps), concurrentCreateApp(space2.metadata.guid, space2Apps)]);

          return browser.wait(promises);
        })
        .then(navAppWall)
    );
  }

  function navAppWall() {
    // Note - always nave to page... this will pick up all the new org
    appsPage.navigateTo();
    appsPage.isActivePage().then(active => {
      if (!active) {
        appsPage.sideNav.goto(SideNavMenuItem.Applications);
      }
      // appsPage.appList.refresh();
      appsPage.loadingIndicator.waitUntilNotShown();
      expect(appList.isTableView()).toBeFalsy();
    });
  }

  function tearDown(orgName: string) {
    expect(orgName).not.toBeNull();
    browser.wait(cfHelper.deleteOrgIfExisting(endpointGuid, orgName));
  }

  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .loginAs(ConsoleUserType.admin)
      .getInfo();
    cfHelper = new CFHelpers(e2eSetup);
  });

  describe('No Pages -', () => {
    const orgName = E2EHelpers.createCustomName(customOrgSpacesLabel) + '-no-pages';
    beforeAll(() => {
      setup(orgName, [], false);
    });

    beforeAll(() => {
      appList.header.getMultiFilterForm().fill({ cf: defaultCf.name, org: orgName });
    });

    it('Should show no entities message', () => {
      expect(appList.isDisplayed()).toBeTruthy();
      appList.empty.getCustom().waitUntilShown();
      expect(appList.empty.getCustom().getComponent().getText()).toEqual(`apps\nThere are no applications for the current filter`);
      expect(appList.cards.getCardCount()).toBe(0);
    });

    afterAll(() => tearDown(orgName));
  });

  describe('Single Page -', () => {
    const orgName = E2EHelpers.createCustomName(customOrgSpacesLabel) + '-1-page';

    let appNames;

    function testSortBy(sortFieldName: string) {
      const sortFieldForm = appList.header.getSortFieldForm();
      sortFieldForm.fill({ 'sort-field': sortFieldName });

      let expectedTitleOrder: string[];
      appList.cards.getCardsMetadata().then(cards => {
        const originalTitleOrder = cards.map(card => card.title);
        expectedTitleOrder = new Array(originalTitleOrder.length);
        for (let i = 0; i < originalTitleOrder.length; i++) {
          expectedTitleOrder[originalTitleOrder.length - i - 1] = originalTitleOrder[i];
        }
      });

      appList.header.toggleSortOrder();

      appList.cards.getCardsMetadata().then(cards => {
        const newTitleOrder = cards.map(card => card.title);
        expect(expectedTitleOrder).toEqual(newTitleOrder);
      });
    }

    beforeAll(() => {
      appNames = createAppNames(3);
      setup(orgName, appNames, true);
      expect(appList.getTotalResults()).toBeLessThanOrEqual(9);
      expect(appList.pagination.isDisplayed()).toBeFalsy();
    }, timeAllowed);

    beforeAll(() => {
      appList.header.getMultiFilterForm().fill({ cf: defaultCf.name, org: orgName });
    });

    afterAll(() => tearDown(orgName), timeAllowed);

    describe('Sorting', () => {

      beforeAll(() => {
        appList.header.setSearchText(baseAppName);
        expect(appList.getTotalResults()).toBeLessThanOrEqual(9);
        expect(appList.pagination.isDisplayed()).toBeFalsy();
      });

      it('sort by name', () => {
        testSortBy('Application Name');
      });

      it('sort by creation', () => {
        testSortBy('Creation Date');
      });
    });

    it('text filter by existing', () => {
      // Clear and check initial cards
      appList.header.clearSearchText();
      expect(appList.header.getSearchText()).toBeFalsy();
      expect(appList.cards.getCardCount()).toBeGreaterThanOrEqual(appNames.length);

      // Apply filter
      const appToFind = appNames[2];
      appList.header.setSearchText(appToFind);

      // Check for single card
      expect(appList.header.getSearchText()).toEqual(appToFind);
      expect(appList.cards.getCardCount()).toBe(1);
      expect(appList.cards.findCardByTitle(appToFind)).toBeDefined();
    });

    it('text filter by non-existing', () => {
      // Clear and check initial cards
      appList.header.clearSearchText();
      expect(appList.header.getSearchText()).toBeFalsy();
      expect(appList.cards.getCardCount()).toBeGreaterThanOrEqual(appNames.length);

      // Apply filter
      const appToNotFind = 'sdfst4654324543224 s5d4x4g5g gdg4fdg 5fdg';
      appList.header.setSearchText(appToNotFind);

      expect(appList.header.getSearchText()).toEqual(appToNotFind);

      // Check for zero cards
      expect(appList.cards.getCardCount()).toBe(0);

      // Check for 'no spaces' message
      appList.empty.getCustom().waitUntilShown();
      expect(appList.empty.getCustom().getComponent().getText()).toBe('apps\nThere are no applications for the current filter');
    });

    it('single page pagination settings', () => {
      expect(appList.pagination.isDisplayed()).toBeFalsy();
    });

  });

  describe('Multi Page -', () => {
    const orgName = E2EHelpers.createCustomName(customOrgSpacesLabel) + '-multi-page';

    let appNames;

    beforeAll(() => {
      appNames = createAppNames(11);
      setup(orgName, appNames, false);
      expect(appList.getTotalResults()).toBeGreaterThanOrEqual(appNames.length);
    }, timeAllowed);

    beforeAll(() => {
      appList.header.getMultiFilterForm().fill({ cf: defaultCf.name, org: orgName });
    });

    afterAll(() => tearDown(orgName), timeAllowed);

    describe('Pagination - ', () => {
      function testStartingPosition() {
        // General expects for all tests in this section
        expect(appList.getTotalResults()).toBeLessThan(80);
        expect(appList.pagination.isPresent()).toBeTruthy();

        expect(appList.cards.getCardCount()).toBe(9);
        expect(appList.pagination.getPageSize('mat-select-4')).toEqual('9');
        expect(appList.pagination.getTotalResults()).toBeGreaterThan(9);

        expect(appList.pagination.getNavFirstPage().getComponent().isEnabled()).toBeFalsy();
        expect(appList.pagination.getNavPreviousPage().getComponent().isEnabled()).toBeFalsy();
        expect(appList.pagination.getNavNextPage().getComponent().isEnabled()).toBeTruthy();
        expect(appList.pagination.getNavLastPage().getComponent().isEnabled()).toBeTruthy();
      }

      beforeEach(testStartingPosition, timeAllowed);

      afterEach(testStartingPosition, timeAllowed);

      it('Initial Pagination Values', () => { });

      it('Next and Previous Page', () => {
        appList.pagination.getNavNextPage().getComponent().click();

        expect(appList.pagination.getNavFirstPage().getComponent().isEnabled()).toBeTruthy();
        expect(appList.pagination.getNavPreviousPage().getComponent().isEnabled()).toBeTruthy();
        expect(appList.pagination.getNavNextPage().getComponent().isEnabled()).toBeFalsy();
        expect(appList.pagination.getNavLastPage().getComponent().isEnabled()).toBeFalsy();

        appList.pagination.getNavPreviousPage().getComponent().click();
      });

      it('Last and First Page', () => {
        appList.pagination.getNavLastPage().getComponent().click();

        expect(appList.pagination.getNavFirstPage().getComponent().isEnabled()).toBeTruthy();
        expect(appList.pagination.getNavPreviousPage().getComponent().isEnabled()).toBeTruthy();
        expect(appList.pagination.getNavNextPage().getComponent().isEnabled()).toBeFalsy();
        expect(appList.pagination.getNavLastPage().getComponent().isEnabled()).toBeFalsy();

        appList.pagination.getNavFirstPage().getComponent().click();
      });

      it('Change Page Size', () => {

        appList.pagination.setPageSize('80', 'mat-select-4');
        expect(appList.cards.getCardCount()).toBeGreaterThan(9);

        expect(appList.pagination.getNavFirstPage().getComponent().isEnabled()).toBeFalsy();
        expect(appList.pagination.getNavPreviousPage().getComponent().isEnabled()).toBeFalsy();
        expect(appList.pagination.getNavNextPage().getComponent().isEnabled()).toBeFalsy();
        expect(appList.pagination.getNavLastPage().getComponent().isEnabled()).toBeFalsy();

        appList.pagination.setPageSize('9', 'mat-select-4');
        expect(appList.cards.getCardCount()).toBe(9);

      });
    });

    function checkApp(appName, shouldFind = true) {
      appList.header.setSearchText(appName);
      expect(appList.getTotalResults()).toBe(shouldFind ? 1 : 0);
      appList.header.clearSearchText();
    }

    it('CF/Org/Space Filters', () => {
      const filters = appList.header.getMultiFilterForm();
      expect(filters.getText('cf')).toBe(defaultCf.name);
      expect(filters.getText('org')).toBe(orgName);
      expect(space1).toBeTruthy();
      expect(space2).toBeTruthy();
      expect(space1Apps).toBeTruthy();
      expect(space2Apps).toBeTruthy();

      // Check initial state
      checkApp(space1Apps[0]);
      checkApp(space2Apps[0]);

      // Org --> Space 1
      filters.fill({ space: space1.entity.name });
      checkApp(space1Apps[0]);
      checkApp(space2Apps[0], false);

      // Space 1 --> Space 2
      filters.fill({ space: space2.entity.name });
      checkApp(space1Apps[0], false);
      checkApp(space2Apps[0]);

      // Space 2 --> All Spaces
      filters.fill({ space: 'All' }, true);
      expect(filters.getText('space')).toBe(' ');
      checkApp(space1Apps[0]);
      checkApp(space2Apps[0]);

      // Org --> default org
      filters.fill({ org: defaultCf.testOrg });
      checkApp(space1Apps[0], false);
      checkApp(space2Apps[0], false);

      // Default org --> all
      filters.fill({ org: 'All' }, true);
      expect(filters.getText('org')).toBe(' ');
      checkApp(space1Apps[0]);
      checkApp(space2Apps[0]);

      // Default cf --> all
      filters.fill({ cf: 'All' }, true);
      expect(filters.getText('cf')).toBe(' ');
      checkApp(space1Apps[0]);
      checkApp(space2Apps[0]);

      appList.header.clearSearchText();

    }, timeAllowed);

  });

});
