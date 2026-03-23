export type CompositeTemplateKey = "signature_printed_name";

export type CompositeFieldTemplate = {
  key: CompositeTemplateKey;
  id: string;
  name: string;
  label: string;
  signature: {
    width: number;
    height: number;
  };
  printedName: {
    width: number;
    height: number;
    gap: number;
    label: string;
    fieldSuffix: string;
  };
};

export const SIGNATURE_PRINTED_NAME_TEMPLATE: CompositeFieldTemplate = {
  key: "signature_printed_name",
  id: "preset-signature-printed-name",
  name: "signature_printed_name",
  label: "Signature + Printed Name",
  signature: {
    width: 100,
    height: 25,
  },
  printedName: {
    width: 100,
    height: 12,
    gap: 0,
    label: "Printed Name",
    fieldSuffix: "__printed_name",
  },
};

export const isCompositeTemplateKey = (value: unknown): value is CompositeTemplateKey =>
  value === SIGNATURE_PRINTED_NAME_TEMPLATE.key;
