"use client"

import * as React from "react"
import { ConsentForm, type ConsentData } from "@/components/medicn/consent-form"

export default function ConsentFormDemo() {
  const [data, setData] = React.useState<ConsentData | null>(null)

  const handleSign = (signedData: ConsentData) => {
    setData(signedData)
    alert(`Consent executed by ${signedData.patientPrintedName}.`)
  }

  return (
    <div className="flex w-full justify-center p-4">
      <ConsentForm
        className="w-full max-w-2xl"
        type="procedure"
        procedureName="Laparoscopic Cholecystectomy"
        description="Removal of gallbladder using 3-4 small laparoscopic incisions under general endotracheal anesthesia."
        risks="Bleeding, surgical site infection, bile duct injury requiring secondary intervention, retained stones, conversion to open laparotomy, anesthesia complications."
        benefits="Resolution of biliary pain / colic, prevention of recurrent acute cholecystitis, gallstone pancreatitis, and cholangitis."
        alternatives="Expectant observation with dietary fat modification, endoscopic retrograde cholangiopancreatography (ERCP) for ductal clearance if indicated."
        status={data?.status ?? "unsigned"}
        patientPrintedName={data?.patientPrintedName ?? "Marcus A. Vance"}
        signedAt={data?.signedAt}
        onSign={handleSign}
      />
    </div>
  )
}
