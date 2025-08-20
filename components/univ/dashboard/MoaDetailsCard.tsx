// components/univ/dashboard/cards/MoaDetailsCard.tsx
"use client";

import { Download } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { MoaStatus } from "@/types/moa-request";
import { cn } from "@/lib/utils";

const LOLOLOL: Record<string, string> = {
  "f8ca0bf0-f9c8-4863-9103-5a2b51d47f32":
    "https://drive.google.com/file/d/15NzoeMB1oPy8O52sh2iW51PocLD1RAUO/view?usp=sharing",
  "ea936655-f0b1-4372-aa2c-226ad5ae4b96":
    "https://drive.google.com/file/d/1yLfmpkyLZM7RJEuUjGIDVR4xfWdh4nC4/view?usp=sharing",
  "b9ceceb0-c656-4515-834c-a23345689cc4":
    "https://drive.google.com/file/d/1w_U1SpmLoa-fYCC4nfbM_LYxT-WWmH0E/view?usp=sharing",
  "7344bcc9-878b-421e-bd29-b6195bbcee90":
    "https://drive.google.com/file/d/11ESPY1V4sbnw0mp-s2iP0EhiIpRtqmMA/view?usp=sharing",
  "b61efeaa-dc06-414a-9eac-9e6740c83cee":
    "https://drive.google.com/file/d/13LPbP72YipHYow7KShIetkK-_gTq5qEF/view?usp=sharing",
  "5630c67c-316f-4432-b717-799ead9eb8e5":
    "https://drive.google.com/file/d/1aGMdoJsidY0q5Dk9eJZAaGPqq2dWo7wj/view?usp=sharing",
  "eb473181-6121-4051-9542-26c3c2e6cb8c":
    "https://drive.google.com/file/d/1KELE6TLMevhKc0IKoI5GS2Jsc9y7rgV9/view?usp=sharing",
  "56713786-37c4-4c4c-81a6-b0a659b406e4":
    "https://drive.google.com/file/d/1w0Yxt1ZImZzNUG9EoqRpUOOwYBBGvzEH/view?usp=sharing",
  "052ff10b-d4e4-478e-8c74-8c77f0948ec3":
    "https://drive.google.com/file/d/1ZhAGOXU95cwHZejHZB6niPyV_B4inJBm/view?usp=sharing",
  "a222b8ca-dfc2-4045-abbd-5ca7f5ff110c":
    "https://drive.google.com/file/d/1U8JlJh5g1Awc9GJR8dSBkK_mzKLmMnSV/view?usp=sharing",
  "7ee26a4a-ff9f-4e52-a963-342bf3252c52":
    "https://drive.google.com/file/d/1JYmVmlmvODaxAeIhecKXubFbPI-8SHLz/view?usp=sharing",
  "4fa971c0-5737-448f-af9f-1658955f2c69":
    "https://drive.google.com/file/d/1VMRQ41-81nQHWGRytKvzZirFigkQcinh/view?usp=sharing",
  "0b2559da-74a2-46e2-9f9e-3c41eec0bcee":
    "https://drive.google.com/file/d/1vLTZOjPJ0Xj2vuJnrs643dW_CH_fnA4U/view?usp=sharing",
  "f9ff132f-511e-407d-bf50-f00776bb4933":
    "https://drive.google.com/file/d/1hN3LBdYwqkY-BuxTYd5G9xvTaDsGRxhJ/view?usp=sharing",
  "28933ff2-e98b-409b-8fd1-461cd1c29ef5":
    "https://drive.google.com/file/d/1OfgKX8lj0IBaALyWQKPzg52Y7SPbaPtg/view?usp=sharing",
  "3331ec32-9648-4991-ab48-c2580232ddcb":
    "https://drive.google.com/file/d/1lk0b27P0w6HcGpJJQ_QDRvIPj6WSOgnS/view?usp=sharing",
  "7a774d0c-1afd-43ec-b73d-3323adca476f":
    "https://drive.google.com/file/d/1qBOc0x8r0_7yOw274O7VkYciEWwLujhD/view?usp=sharing",
  "3dbe3b21-2b01-4278-bfc9-8e3e3b2a2f92":
    "https://drive.google.com/file/d/1LZOm0srEcKd_Hk-fxcYh9eDVklcWB7oT/view?usp=sharing",
  "2a8dddc4-d208-4ab9-80f2-d5a9341ce344":
    "https://drive.google.com/file/d/1lMeGXzKeu1oDmwUfKH4JgbEkdgsXLzxH/view?usp=drivesdk",
  "010d0d51-afce-463e-84d0-bbd04d851856":
    "https://drive.google.com/file/d/1ail4qZmNW3trHWm7c9-AkpcEmaGn2EtD/view?usp=sharing",
  "fb740018-a24c-4906-8042-6c3f7e484aca":
    "https://drive.google.com/file/d/1DlHOt388_98O9dT2BTHlcueCAan-4Gs5/view?usp=sharing",
  "59ae1159-e9e4-4ee7-a8fb-3b76a8c0abae":
    "https://drive.google.com/file/d/1fmZ9oiYTw_Ti-d3_TH9KIxy5Hq9y7Lg0/view?usp=sharing",
  "de339800-0b7e-4121-a9dd-5d182dbd4828":
    "https://drive.google.com/file/d/1OayMmzGZdNRQb0vZT-Ov9k--6pKb0blg/view?usp=sharing",
  "c2d40e23-5cd8-4cba-b5fa-9fc6c52c9766":
    "https://drive.google.com/file/d/1j5sW6_a86ginXiDbtrxZ93vBQqzhFoUz/view?usp=sharing",
  "8a7992ca-79d6-4445-90a3-ca576e829a60":
    "https://drive.google.com/file/d/1SGk_u1RXUMheUcqFY1wGHLpFS0_8Eaux/view?usp=sharing",
  "98521cce-91c0-4352-8890-2455751b74d6":
    "https://drive.google.com/file/d/1JvG9LtuJFBmUURvZ5c2vhmjzCYL6rEWK/view?usp=sharing",
  "c8a3f909-1267-49a2-bb08-8a1069c32bb3":
    "https://drive.google.com/file/d/1LXJxe3eTwY6XW_G7zcTy-w7ChMSG6k9u/view?usp=sharing",
  "8cfe56b7-505d-4875-be11-9027b92ed1db":
    "https://drive.google.com/file/d/19-38HVOMMbt7NrHvfM_6d3sFW_MVHJZ7/view?usp=sharing",
  "ad82bae6-43b4-4d5f-a87d-b4d44894609c":
    "https://drive.google.com/file/d/1ZST6nZJgLDi9vM_bFP6vlgXkKMxnXhsV/view?usp=sharing",
  "58b9bc0f-d555-4f17-95ff-b59e2ac0defb":
    "https://drive.google.com/file/d/1WJft9g2b1zpEC4Uc1W0DAJG-z0LS4Zvw/view?usp=sharing",
  "5bc2538f-466d-450f-8894-dff6078ed018":
    "https://drive.google.com/file/d/1XfP9TW6VP_PBx_qSukvfHJMJnFbyGTTc/view?usp=sharing",
  "e31eed7a-8096-4e9e-a149-9e4282b4e4be":
    "https://drive.google.com/file/d/19vRbTdFUVqLULXhVWLJAcS0QinfHdqXo/view?usp=sharing",
  "0599d1cd-a2bc-4ba9-9ce7-3619f6f2b07d":
    "https://drive.google.com/file/d/1mtTubuv-vRR6Sbu1vvXFZwQIyQAtTk0L/view?usp=sharing",
  "befa93b0-9901-4ddc-b8f0-f3331fb610cc":
    "https://drive.google.com/file/d/12n9aGxBU21yoFwjdjVrPuCYVxhLk3anp/view?usp=sharing",
  "f237f4cd-f809-485a-9f1a-80f2ef6fe050":
    "https://drive.google.com/file/d/1DrhSxayQfuXOVSMg88u1zbNNrp3wO5dI/view?usp=sharing",
  "ee8a8a80-40e5-42a0-bc1e-22fc3b69f1ec":
    "https://drive.google.com/file/d/1LHPCDcwpi03_wq1hPScufbLH460Ffd4F/view?usp=sharing",
  "5b9d0384-447d-4fe9-ba05-1ae41d931c96":
    "https://drive.google.com/file/d/16VdpsuvZnI0Ra_s5Vfc5IYMV32fdfEyo/view?usp=sharing",
  "5e000410-316d-4cf9-9213-af0a6d3d4d6e":
    "https://drive.google.com/file/d/1OdZdP_vArVmEFMzfvclKJC-gQH5U6nIY/view?usp=sharing",
  "62727dc6-66c6-421a-bbe6-72ee78dfe98c":
    "https://drive.google.com/file/d/1sNWZMbfzogo2HAPtXNEVzL6DTznZ1quy/view?usp=sharing",
  "77aaca42-9e35-4a26-a3d6-65744d3f18d8":
    "https://drive.google.com/file/d/1hQKlELMfd_9PREs-c9R4ZQxQwwGJ4JTQ/view?usp=sharing",
  "70385211-68fa-47d8-83a5-f7f0e6a8d645":
    "https://drive.google.com/file/d/1HYvl7yOHVckrYCoZf7hYlohArTGDQQGr/view?usp=sharing",
  "6fe8b731-68f2-44fc-b8ba-6da6fa930392":
    "https://drive.google.com/file/d/15wUh837uocJzniUSBTFCACHEfTui0_04/view?usp=sharing",
  "fa0fcc00-97ba-41b3-aa0f-18e51e93270b":
    "https://drive.google.com/file/d/1fqoMJ0FM3dKlboqGlQX2N1g8k4rqlTdS/view?usp=sharing",
  "cf922a6c-eb95-4f79-a4ba-313bbb7586db":
    "https://drive.google.com/file/d/1EnU2x6Z54hPxX5IVqTnciv5cYkHbUIKw/view?usp=sharing",
  "5933c832-a675-4a06-b724-f2f5a233f7b4":
    "https://drive.google.com/file/d/1TZqkXEd32lDXVnYjpoz-do2QI1LPNqHJ/view?usp=sharing",
  "82098f3c-9650-4f9b-82cb-2d53b71d283b":
    "https://drive.google.com/file/d/17aSeVJuA5TjS8wxlBd01bPCJD0xaf4Pb/view?usp=sharing",
  "91c8e379-2d67-491f-b50f-81b60cd4d6e7":
    "https://drive.google.com/file/d/10LKtaXHk71Oc2N0rv-0zpQk60rbJN1EA/view?usp=sharing",
  "7f53d30b-32d5-4e2e-b747-b98e6690350d":
    "https://drive.google.com/file/d/1NHSjpjMonusGazmwj1xYSPT47OIrvV6M/view?usp=sharing",
  "bedb77da-2e04-4703-9058-7db863367e6a":
    "https://drive.google.com/file/d/19Cx8D3AW17VHYA3YIGWf1QHkdvWaeqGN/view?usp=sharing",
  "481471ff-2715-4457-b684-49c1b979a146":
    "https://drive.google.com/file/d/1kYP0ZBatjrSSGyKKmvayMxei7_f8wczT/view?usp=sharing",
  "507c30af-9176-4f7f-8712-32f9c988bdd6":
    "https://drive.google.com/file/d/1XMJWLkYDOADzEmrh9z7W_oI2pUj495ZI/view?usp=sharing",
  "983f0d4a-ab05-4a5a-bd02-85f850746e60":
    "https://drive.google.com/file/d/1umMjG3qsqM4p1CPXQjqdI3JWDYcJi5lc/view?usp=sharing",
  "364ce751-ee27-4684-b5d7-7ebb02a02daa":
    "https://drive.google.com/file/d/1vQvzGapOII_ywJd2_DPUlkXXcHIqrE3M/view?usp=sharing",
  "6e959698-f803-4d42-8725-c83d98f4d668":
    "https://drive.google.com/file/d/1J7csJmlQjyecxz6k6q5RfWYb0DnQLrZc/view?usp=sharing",
  "abe7a02f-8eb9-4086-aeef-9482c76b5c82":
    "https://drive.google.com/file/d/1udf4mO97RPdmoz4XWA53tB8c_UTNzW_4/view?usp=sharing",
  "a8853679-abfa-4cdf-9663-a1b39499a918":
    "https://drive.google.com/file/d/1WXw24Exm7GPx9rsIVPxqSwkvXKb7W4bs/view?usp=sharing",
  "208c0695-ced9-49fe-b440-430bbb7a2ece":
    "https://drive.google.com/file/d/16c-1tnk83mNgwMXCbo08X8ZTAVratIXp/view?usp=sharing",
  "3faa6fb0-a612-4606-a268-4abcb74978fc":
    "https://drive.google.com/file/d/1h4oaGzYb30p92RklmjnAz3ihvEPT9v-0/view?usp=sharing",
  "b3c55946-60dd-4a47-88ee-7724d2f36f4a":
    "https://drive.google.com/file/d/1ubwJGKFjtzh3Ocnj2DE2MhBKUe83T-5w/view?usp=sharing",
  "444b9b0b-e13d-41a0-b4d0-403e667173b4":
    "https://drive.google.com/file/d/1ztyQIjRSlGXkUiQnz9FpLeCzwE4pyxDX/view?usp=sharing",
  "9505af8b-4de3-4deb-9bbd-06c8ec596fb3":
    "https://drive.google.com/file/d/1-4EoeP94Zhr2WYwjAZJbzdVfUjodFI8E/view?usp=sharing",
  "776fad39-765e-43d4-b8be-80003bc0a0e5":
    "https://drive.google.com/file/d/1JxFBFlXg_h9SoZHGyRTTe4sVJsrc39z8/view?usp=sharing",
  "4a234529-3c6a-4209-b1b6-2967a8dddfb5":
    "https://drive.google.com/file/d/1eJfp1bFibmCjXHzPLE54W6zea-cxbIEU/view?usp=sharing",
  "56c1572f-1487-4525-a931-52c42ba80b2b":
    "https://drive.google.com/file/d/1QJoHxJbxvmjK4KJC8JqrFAnh6gkv6Ndw/view?usp=sharing",
  "88cbc34f-a726-40de-b1ee-1fc99e57e348":
    "https://drive.google.com/file/d/1mgl2ve89AZzcIQIFLZCC9q5MFcnjt8-E/view?usp=sharing",
  "1fc77223-70c4-4759-b076-efcc9b9a096b":
    "https://drive.google.com/file/d/1zYFJ1VbMrlAdS26mznc5n0WojtH7WUCQ/view?usp=sharing",
  "3dc1a546-21b6-406e-9c12-be0949a82a2f":
    "https://drive.google.com/file/d/1wZI9vImolPymfNIWk-XoXOLdMsCk73SS/view?usp=sharing",
  "b11b03bf-90ba-406e-967b-bd4ba880555b":
    "https://drive.google.com/file/d/15e13Esl-qzgtQUj0-jKR3aoO-4w7Svk5/view?usp=sharing",
  "ea712cc7-14c0-492a-955e-dc97362c818b":
    "https://drive.google.com/file/d/1nbpR26jTmAe1qzbTJOLS7vps-j2TvNty/view?usp=sharing",
  "a316068d-1197-4008-be5c-52372f751ad7":
    "https://drive.google.com/file/d/1df44042dVz1-d62AzKFUoqEiJVVmvefb/view?usp=sharing",
  "63594bd8-d4e7-435c-92b0-2edd77ea16b6":
    "https://drive.google.com/file/d/1E8yAmWZMbVW5LXw2hPJpeNvVgkuIM6go/view?usp=sharing",
  "cc8de710-6d9f-495c-8341-e38b9b891208":
    "https://drive.google.com/file/d/1YIWhS16qKYoAXd-Lm5s-LIM8knDS1dzM/view?usp=sharing",
  "f9a669e9-3882-478b-a775-a4e7187fc4dc":
    "https://drive.google.com/file/d/1lRyjvsIHYbFUPIdv2iuq8--XQd3ZVmOu/view?usp=sharing",
  "3a3c69a0-2442-45c2-93a7-04fb7f620411":
    "https://drive.google.com/file/d/1poePC2FW12P9x_R0Hf_fm2GG813DhW08/view?usp=drivesdk",
  "5fdf02cc-a9dd-4a73-90ae-fa060d5718fa":
    "https://drive.google.com/file/d/11V35Ntt0Brkg-0ALUVeOZI4ULhdJwsbS/view?usp=drivesdk",
  "aa92f0c3-0469-4404-9fce-ecf5c94427f1":
    "https://drive.google.com/file/d/1_nZzo0nUdQRS1XgakthgtGxIa9vObTE1/view?usp=drivesdk",
  "c94788b7-8070-469f-b0e4-ba1cc99103db":
    "https://drive.google.com/file/d/1vYHTIeX4BxJEDh36mq_3nk0rjlWVtPnY/view?usp=drivesdk",
  "02774c57-bf66-43c9-8bfd-607f73c2d3b5":
    "https://drive.google.com/file/d/19fgpG2bOby3aCRzq2SIfoIMdMwB14NbP/view?usp=drivesdk",
  "aa696961-118e-4ced-bb57-4b23ca837e2e":
    "https://drive.google.com/file/d/1f8ODqIh59qj0t0urqHjghplx7aJd17BB/view?usp=drivesdk",
  "d06fba86-2143-43d6-98e8-92f124ceb0b1":
    "https://drive.google.com/file/d/1Gqv0dL60-LnuYGVQhqSES9LyCYzqa1D4/view?usp=drivesdk",
  "784745e1-2c30-4030-a7dc-287a8ab8128c":
    "https://drive.google.com/file/d/1KLlbT-fTs74ed0mw6NG5hyysBCPoN-Qj/view?usp=drivesdk",
  "6b791ed6-f3f8-4384-bcb4-f90c76302b15":
    "https://drive.google.com/file/d/1eWx7IgPIJAFcPo5gF1YuW5qVyhWYJmLp/view?usp=drivesdk",
  "6e16bc24-ce4c-4e53-89b4-425812033323":
    "https://drive.google.com/file/d/1kiKRyeQWZKVeikofEjBBHcGPCkSAZ9fZ/view?usp=drivesdk",
  "0f5bd4ca-f3c7-4326-b67f-d1cafd0f43db":
    "https://drive.google.com/file/d/1qEq97bQL_tUJg1t6_CvhNAARMD-YT5JF/view?usp=drivesdk",
  "a1dfe962-63f8-41d1-b75a-ad7da2cba9af":
    "https://drive.google.com/file/d/1EDpkiPBUd6lchHsV4kMN9WQNHZgIwIBd/view?usp=drivesdk",
  "aeb572e6-bff2-420b-b0ee-0714cfac6d4f":
    "https://drive.google.com/file/d/1tOB2sHiEnDikKV6BjxdvK6gallQG-Rwe/view?usp=drivesdk",
  "0f85f70a-a122-45f4-9944-c8b01ff19970":
    "https://drive.google.com/file/d/1p3UV_fXBK5YE_HxSbm5vDN2iEfGP40KJ/view?usp=drivesdk",
  "166fd5d2-e479-492c-acd9-1b2c2f763059":
    "https://drive.google.com/file/d/1-j4Zv7eABzMNHKKQtqpoD4R1BWr3FybS/view?usp=drivesdk",
  "43a5d797-087d-4f2e-b658-b43bfe03999e":
    "https://drive.google.com/file/d/1TP-cWxK2ptqhmAKadUw7LsECRqMtBTIk/view?usp=drivesdk",
  "9bb74de7-a141-43ae-ac54-8de8bb52d760":
    "https://drive.google.com/file/d/1IE2aKerXwLD1wU-7O9VDk9kimzxT6lif/view?usp=drivesdk",
  "b3ac215c-9b38-4e74-988a-18b893e92448":
    "https://drive.google.com/file/d/1K6ym_h3T1gP6E4jlrTI6E62EUHHmTBjo/view?usp=drivesdk",
  "c28d0ca6-5f4d-4ec1-bb2b-257a042adf8e":
    "https://drive.google.com/file/d/1IJjr8yu_Rbu6DeEG3iBMuNpgm15paENx/view?usp=drivesdk",
  "c5a3c5c2-92f7-4218-8793-836be9ed6352":
    "https://drive.google.com/file/d/18shOcZSkrT3VDsyKZNFp8XQBEvDeRkZD/view?usp=drivesdk",
};

type Props = {
  companyId: string;
  companyName: string;
  status: MoaStatus;
  validUntil?: string;
  loading?: boolean;
};

export default function MoaDetailsCard({ companyId, companyName, status, validUntil, loading }: Props) {
  return (
    <div className="rounded-[0.33em] border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{companyName}</h2>
        <a
          href={LOLOLOL[companyId] as string}
          target="_blank"
          download
          className={cn(
            "border-primary bg-primary hover:bg-primary/90 inline-flex items-center rounded-[0.33em] border px-3 py-2 text-sm font-medium text-white",
            !!LOLOLOL[companyId] ? "" : "opacity-60"
          )}
        >
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Preparing..." : !!LOLOLOL[companyId] ? "Download MOA" : "No MOA"}
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-sm">MOA Status</div>
          <div className="mt-1">
            {/* @ts-ignore */}
            <StatusBadge status={status} />
          </div>
        </div>
      </div>
    </div>
  );
}
