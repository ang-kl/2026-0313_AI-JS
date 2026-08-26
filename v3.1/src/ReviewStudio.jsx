import React, { useState } from "react";
import ReviewStudioLegacy from "./ReviewStudioLegacy.jsx";
import WorkUniverseLanding from "./work-universe/WorkUniverseLanding.jsx";

// Preserve the named helper contract consumed by App.jsx. The Step 3 wrapper
// changes only the default surface; deterministic helpers continue to come from
// the byte-preserved legacy implementation.
export { rsNormTitle, rsJaccard, rsTokens, rsEmpTypeBucket } from "./ReviewStudioLegacy.jsx";

// v3.1 Step 3 entry wrapper.
// Steps 1 and 2 continue to call ReviewStudio through the same import path.
// The existing Review Studio implementation is preserved byte-for-byte in
// ReviewStudioLegacy.jsx; this wrapper only inserts the Work Universe as the
// first Step 3 surface.
export default function ReviewStudio(props) {
  const [surface, setSurface] = useState("universe");

  if (surface === "studio") {
    return <ReviewStudioLegacy {...props} />;
  }

  return (
    <WorkUniverseLanding
      result={props.result}
      title={props.title}
      employer={props.employer}
      source={props.source}
      band={props.band}
      posting={props.posting}
      onBack={props.onBack}
      onEnterStudio={() => setSurface("studio")}
    />
  );
}
