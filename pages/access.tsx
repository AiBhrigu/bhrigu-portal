import type { GetServerSidePropsContext } from "next";

import AccessClosedSurface from "../components/AccessClosedSurface";
import AccessIntakeForm, {
  getServerSideProps as buildAccessIntakeProps,
} from "../components/AccessIntakeForm";
import { provePrivateAccessStoreReadable } from "../lib/access-private-intake";
import { resolveAccessDeliveryConfig } from "../lib/access-submit-delivery-runtime";

const LOCAL_SYNTHETIC_READY_VALUE =
  "LOCAL-CI-NON-PERSONAL-ACCESS-READINESS-V0-1";

type IntakeProps = Parameters<typeof AccessIntakeForm>[0];

type AccessPageProps = IntakeProps & {
  intakeEnabled: boolean;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<{ props: AccessPageProps }> {
  context.res.setHeader("Cache-Control", "private, no-store, max-age=0");
  context.res.setHeader("Pragma", "no-cache");

  const intakeProps = await buildAccessIntakeProps({
    query: context.query,
  });

  let intakeEnabled = false;
  const localSyntheticReady =
    !process.env.VERCEL &&
    process.env.ACCESS_PRIVATE_INTAKE_SYNTHETIC_READY ===
      LOCAL_SYNTHETIC_READY_VALUE;

  if (localSyntheticReady) {
    intakeEnabled = true;
  } else if (
    process.env.ACCESS_PRIVATE_INTAKE_PUBLIC_ENABLED === "true"
  ) {
    try {
      resolveAccessDeliveryConfig();
      await provePrivateAccessStoreReadable();
      intakeEnabled = true;
    } catch {
      intakeEnabled = false;
    }
  }

  const exactIntakeProps = intakeProps.props as IntakeProps;

  return {
    props: {
      ...exactIntakeProps,
      intakeEnabled,
    },
  };
}

export default function AccessPage(props: AccessPageProps) {
  const { intakeEnabled, ...intakeProps } = props;
  if (!intakeEnabled) {
    return <AccessClosedSurface />;
  }

  return <AccessIntakeForm {...intakeProps} />;
}
