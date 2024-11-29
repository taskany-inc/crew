import { router } from '../trpcBackend';

import { groupRouter } from './groupRouter';
import { userRouter } from './userRouter';
import { feedbackRouter } from './feedbackRouter';
import { searchRouter } from './searchRouter';
import { serviceRouter } from './serviceRouter';
import { roleRouter } from './roleRouter';
import { deviceRouter } from './deviceRouter';
import { organizationUnitRouter } from './organizationUnitRouter';
import { bonusPointsRouter } from './bonusPointsRouter';
import { vacancyRouter } from './vacancyRouter';
import { hireIntegrationRouter } from './hireIntegrationRouter';
import { appConfigRouter } from './appConfigRouter';
import { achievementRouter } from './achievementRouter';
import { historyEventRouter } from './historyEventsRouter';
import { scheduledDeactivationRouter } from './scheduledDeactivationRouter';
import { userRoleRouter } from './userRoleRouter';
import { attachRouter } from './attachRouter';
import { userCreationRequestRouter } from './userCreationRequestRouter';
import { supplementalPositionRouter } from './supplementalPositionRouter';
import { permissionServiceRouter } from './permissionServiceRouter';
import { importRouter } from './importRouter';
import { mailSettingsRouter } from './mailingSettingsRouter';

export const trpcRouter = router({
    user: userRouter,
    group: groupRouter,
    feedback: feedbackRouter,
    search: searchRouter,
    service: serviceRouter,
    role: roleRouter,
    userRole: userRoleRouter,
    device: deviceRouter,
    organizationUnit: organizationUnitRouter,
    bonusPoints: bonusPointsRouter,
    vacancy: vacancyRouter,
    hireIntegration: hireIntegrationRouter,
    appConfig: appConfigRouter,
    achievement: achievementRouter,
    historyEvent: historyEventRouter,
    scheduledDeactivation: scheduledDeactivationRouter,
    attach: attachRouter,
    userCreationRequest: userCreationRequestRouter,
    supplementalPosition: supplementalPositionRouter,
    permissionService: permissionServiceRouter,
    import: importRouter,
    mailSettings: mailSettingsRouter,
});

export type TrpcRouter = typeof trpcRouter;
