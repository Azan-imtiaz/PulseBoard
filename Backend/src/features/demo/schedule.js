import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { UserModel } from '../auth/user.model.js';
import { resetDemo } from './resetDemo.js';

// Resets the demo every DEMO_RESET_HOURS, but only on servers where it has been
// seeded at least once, so a deployment without a demo never grows one.
export function scheduleDemoReset() {
  if (!config.DEMO_RESET_HOURS) return null;

  const run = async () => {
    if (!(await UserModel.exists({ isDemo: true }))) return;
    await resetDemo();
    logger.info('demo workspace reset');
  };
  return setInterval(
    () => run().catch((err) => logger.error({ err }, 'demo reset failed')),
    config.DEMO_RESET_HOURS * 3_600_000,
  );
}
