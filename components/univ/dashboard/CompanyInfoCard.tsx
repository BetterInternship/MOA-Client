// components/univ/dashboard/cards/CompanyInfoCard.tsx
"use client";

import Detail from "./Detail";

type Props = {
  id: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
};

const TODELETE: Record<string, string> = {
  "f8ca0bf0-f9c8-4863-9103-5a2b51d47f32":
    "4th floor Two Shopping Center Taft Avenue corner Cuneta Avenue Pasay City,'Logistics'",
  "ea936655-f0b1-4372-aa2c-226ad5ae4b96":
    "Unit 1408 Herrera Tower 98 Rufino cor. Valero Sts Salcedo Village Makati,' multimedia arts web development mobile applications systems development and e-learning'",
  "b9ceceb0-c656-4515-834c-a23345689cc4":
    "10F King's Court Tower 1 Don Chino Roces Ave cor dela Rosa Makati,''",
  "7344bcc9-878b-421e-bd29-b6195bbcee90": "8001 Edsa Quezon City,''",
  "b61efeaa-dc06-414a-9eac-9e6740c83cee":
    "NAC Tower 32nd Street Bonifacio Global City Taguig City,'holding company for the Aboitiz Group's investments in power generation and distribution as well as retail electricity and other related services'",
  "5630c67c-316f-4432-b717-799ead9eb8e5":
    "Unit 502 5F Orient Square Bldg. F. Ortigas Center Pasig,''",
  "eb473181-6121-4051-9542-26c3c2e6cb8c":
    "7th floor Cybergate Tower I Pioneer St. Cor. EDSA 1554 Mandaluyong City Philippines,'IT Solutions and Services'",
  "56713786-37c4-4c4c-81a6-b0a659b406e4":
    "11th Floor Global Tower Ciano Bldg. Gen Mascardo St. Brgy. Bangkal Makati City,'IT Solutions and Services'",
  "052ff10b-d4e4-478e-8c74-8c77f0948ec3":
    "28 First Avenue Bagumbayan Taguig City Metro Manila 1631 Philippines,''",
  "a222b8ca-dfc2-4045-abbd-5ca7f5ff110c":
    "Suite 22B2 Golden Empire Tower 1322 Roxas Blvd. Ermita Manila,''",
  "7ee26a4a-ff9f-4e52-a963-342bf3252c52":
    "Mezzanine Floor Draper Startup House 5048 P. Burgos Street Poblacion 1210 City of Makati,''",
  "4fa971c0-5737-448f-af9f-1658955f2c69":
    "3/F Net One Center 3rd Avenue cor 26th Street Bonifacio Global City Taguig City,''",
  "0b2559da-74a2-46e2-9f9e-3c41eec0bcee": "2286 Alson Bldg Pasong Tamo ext. Makati City,''",
  "f9ff132f-511e-407d-bf50-f00776bb4933": "PO Box 437 Subiaco WA 6904 Australia,''",
  "28933ff2-e98b-409b-8fd1-461cd1c29ef5":
    "Room 905 Vicente Madrigal Bldg. Ayala Avenue Makati City,'IT Services'",
  "3331ec32-9648-4991-ab48-c2580232ddcb":
    "21st Floor Arthaland Century Pacific Tower 5th Avenue (corner 30th Street) 1634 Bonifacio Global City Taguig,'IT Services'",
  "7a774d0c-1afd-43ec-b73d-3323adca476f": "Ecotower 32nd st cor 9th Ave BGC Taguig City,''",
  "3dbe3b21-2b01-4278-bfc9-8e3e3b2a2f92":
    "Gateway Business Park Brgy. Javalera,'combines analog digital and software technologies into solutions'",
  "2a8dddc4-d208-4ab9-80f2-d5a9341ce344":
    "712-714 West Tower Philippine Stock Exchange Exchange Rd. Ortigas Center Pasig City,''",
  "010d0d51-afce-463e-84d0-bbd04d851856":
    "Apollo Center 4120 Kalayaan Ave (Near cor. Chino Roces Ave.) Makati City 1205,''",
  "fb740018-a24c-4906-8042-6c3f7e484aca":
    "Unit 708 Page Building 1215 Acacia Avenue Ayala ALabang Muntinlupa City,''",
  "59ae1159-e9e4-4ee7-a8fb-3b76a8c0abae":
    "'2016A West Tower Tektite Towers Exchange Road Ortigas Center San Antonio City of Pasig',''",
  "de339800-0b7e-4121-a9dd-5d182dbd4828": "Road 3 Project 6 Quezon City,''",
  "c2d40e23-5cd8-4cba-b5fa-9fc6c52c9766":
    "7th Floor Feliza Building VA Rufino Street Legazpi Village Makati City,'Health Maintenance Organization (HMOs)'",
  "8a7992ca-79d6-4445-90a3-ca576e829a60":
    "6/F The Athenaeum Building 160 L.P. Leviste Street Salcedo Village Makati City 1227,'Interim and Project Staffing services provider'",
  "98521cce-91c0-4352-8890-2455751b74d6": "Joy-Nostalg Centrer 17 ADB Avenue Ortigas Pasig City,''",
  "c8a3f909-1267-49a2-bb08-8a1069c32bb3":
    "N5 Alchemy Unit G/F Casa Baronesa 86 Esteban Abada St. Loyola Heights Quezon City,'Software Research and Development Product Research and Development company developing innovative world-class software and hardware solutions'",
  "8cfe56b7-505d-4875-be11-9027b92ed1db": "26 General Tirona Street Caloocan City,''",
  "ad82bae6-43b4-4d5f-a87d-b4d44894609c": "No. 15 Palmera St. Brgy. Culiat Quezon City,''",
  "58b9bc0f-d555-4f17-95ff-b59e2ac0defb":
    "Unit 8802 Crowne 88 Condominum 88 Panay Avenue Quezon City,''",
  "5bc2538f-466d-450f-8894-dff6078ed018":
    "W-2802B Tektite Towers Exchange Road Ortigas Ctr. Pasig City 1605 Metro Manila,'Software Development IT Services'",
  "e31eed7a-8096-4e9e-a149-9e4282b4e4be":
    "71 Greenmeadows Avenue Brgy Ugong Norte Quezon City Philippines 1110,''",
  "0599d1cd-a2bc-4ba9-9ce7-3619f6f2b07d":
    "44 Senator Gil Puyat Ave. Makati City,'Banking and Finance'",
  "befa93b0-9901-4ddc-b8f0-f3331fb610cc":
    "BPI Head Office Building Ayala Avenue cor. Paseo de Roxas Makati City,'Banking and Finance'",
  "f237f4cd-f809-485a-9f1a-80f2ef6fe050": "24th Floor 8767 Paseo de Roxas Makati City,''",
  "ee8a8a80-40e5-42a0-bc1e-22fc3b69f1ec":
    "12F Primeland Tower 2218 Market St. Madrigal Business Park Ayala Alabang Muntinlupa City,''",
  "5b9d0384-447d-4fe9-ba05-1ae41d931c96":
    "Unit 2505 25th Floor Discovery Center 25 ADB Avenue Ortigas Center Pasig City Metro Manila,'Outsourcing eCommercce'",
  "5e000410-316d-4cf9-9213-af0a6d3d4d6e":
    "BDO Corporate Center 7899 Makati Avenue,'Banking and Finance'",
  "62727dc6-66c6-421a-bbe6-72ee78dfe98c":
    "11F South Tower Rockwell Business Center Sheridan corner United Street Mandaluyong City,''",
  "77aaca42-9e35-4a26-a3d6-65744d3f18d8":
    "15F THE BRILLIANCE CENTER 11TH AVE CORNER 40TH STREET BGC TAGUIG PHILIPPINES 1634,''",
  "70385211-68fa-47d8-83a5-f7f0e6a8d645":
    "96 Burgos Street Pamplona Uno Las Piñas City,'IT Solutions and Services'",
  "6fe8b731-68f2-44fc-b8ba-6da6fa930392": "310 Elan Village Lane San Jose CA 95134,''",
  "fa0fcc00-97ba-41b3-aa0f-18e51e93270b":
    "Unit 3 &amp; 4 G/F The Nexus Center 1010 Metropolitan Avenue San Antonio Makati City 1203,''",
  "cf922a6c-eb95-4f79-a4ba-313bbb7586db":
    "#04-01 495 Yio Chu Kang Road Singapore 787080,'Game Development'",
  "5933c832-a675-4a06-b724-f2f5a233f7b4":
    "Unit 1 1 Tomas Morato Quezon City,'online grocery market'",
  "82098f3c-9650-4f9b-82cb-2d53b71d283b":
    "Unit 28F2 Fort Palm Spring Condominium 1st Ave cor 30th St Taguig City,'Software Development'",
  "91c8e379-2d67-491f-b50f-81b60cd4d6e7":
    "3rd Floor Upper McKinley Road One World Square Bldg. Fort Bonifacio Taguig City,''",
  "7f53d30b-32d5-4e2e-b747-b98e6690350d":
    "2004A West Tower Tektite Building Exchange Road Ortigas Pasig City,''",
  "bedb77da-2e04-4703-9058-7db863367e6a":
    "Unit 1606 The Centerpoint Condominium Julia Vargas Ave cor Garnet Street Ortigas Center Pasig City 1600,''",
  "481471ff-2715-4457-b684-49c1b979a146":
    "Level 3B 111 Paseo de Roxas Bldg. Paseo de Roxas cor. Legaspi St. Legaspi Village Makati City,''",
  "507c30af-9176-4f7f-8712-32f9c988bdd6":
    "at [t745 Villar St. cor. Paseo De Roxas St. Makati Cily,''",
  "983f0d4a-ab05-4a5a-bd02-85f850746e60":
    "Cebu Pacific Airline Operations Center (AOC) Domestic Road Barangay 191 Zone 20 Pasay City 1301,''",
  "364ce751-ee27-4684-b5d7-7ebb02a02daa":
    "Centerpoint Building Julia Vargas Avenue cor Garnet Road Ortigas Center Pasig City,''",
  "6e959698-f803-4d42-8725-c83d98f4d668":
    "Unit C 37/F Century Peak Tower 1439 M. Adriatico Cor. Sta. Monica St. Barangay 669 072 Ermita Manila,''",
  "abe7a02f-8eb9-4086-aeef-9482c76b5c82":
    "2F One World Square McKinley Hills Taguig Metro Manila,''",
  "a8853679-abfa-4cdf-9663-a1b39499a918":
    "Unit 20 I-Park Center Eulogio Amang Rodriguez Ave Pasig Metro Manila,''",
  "208c0695-ced9-49fe-b440-430bbb7a2ece":
    "35/F Yuchengco Tower RCBC Plaza 6819 Ayala corner Gil Puyat Avenue Makati City,''",
  "3faa6fb0-a612-4606-a268-4abcb74978fc":
    "Penthouse Floor Anson's Bldg. 23 ADB Avenue Ortigas Center Pasig City,''",
  "b3c55946-60dd-4a47-88ee-7724d2f36f4a":
    "Unit 1410 Cityland Hererra Tower Rufino corner Valero Sts. Makati City,''",
  "444b9b0b-e13d-41a0-b4d0-403e667173b4": "Citi Tower 12th Floor,'Banking and Finance'",
  "9505af8b-4de3-4deb-9bbd-06c8ec596fb3":
    "5/F RCPI Bldg. 711 EDSA corner New York St. Cubao Quezon City Philippines,''",
  "776fad39-765e-43d4-b8be-80003bc0a0e5":
    "30th floor Philamlife Tower 8767 Paseo De Roxas Makati City 1226,''",
  "4a234529-3c6a-4209-b1b6-2967a8dddfb5":
    "25D Zeta Building Salcedo Street Legazpi Village Makati City Philippines,''",
  "56c1572f-1487-4525-a931-52c42ba80b2b":
    "10F One World Place 32nd Street Bonifacio Global City Taguig City Philippines,'Data Science and Management Consulting'",
  "88cbc34f-a726-40de-b1ee-1fc99e57e348":
    "28F Six Neo 5th Avenue corner 26th St. Bonifacio Global City Taguig City Philippines 1634,''",
  "1fc77223-70c4-4759-b076-efcc9b9a096b":
    "7F PNB Makati Allied Bank Center 6754 Ayala Ave cor. Legazpi Street Makati City,''",
  "3dc1a546-21b6-406e-9c12-be0949a82a2f":
    "'40 th floor Rufino Pacific Tower 6784 Ayala Avenue Makati City',''",
  "b11b03bf-90ba-406e-967b-bd4ba880555b":
    "25th Floor Ayala North Exchange Tower Two 6798 Ayala Avenue corner Salcedo Street Makati City,''",
  "ea712cc7-14c0-492a-955e-dc97362c818b":
    "Reliance IT Center #99 E. Rodriguez Jr. Avenue Ugong Pasig City,''",
  "a316068d-1197-4008-be5c-52372f751ad7":
    "Unit 1005 The Centerpoint Building Julia Vargas Avenue corner Garnet Road Ortigas Center Pasig City,'Software Development Web Applications'",
  "63594bd8-d4e7-435c-92b0-2edd77ea16b6":
    "Fort Legend Towers 31st St. cor. 3rd Ave. Bonifacio Global City Taguig City 1634,''",
  "cc8de710-6d9f-495c-8341-e38b9b891208": "DICT Building Roces Avenue Diliman Quezon City,''",
  "f9a669e9-3882-478b-a775-a4e7187fc4dc":
    "29th Floor Summit One Tower 530 Shaw Boulevard Brgy. Highway Hills Mandaluyong City,''",
  "3a3c69a0-2442-45c2-93a7-04fb7f620411":
    "Unit 104 Grd. Flr. Alpap II Bldg. Trade St. Cor. Investment Drive Madrigal Business Park Muntinlupa 1790,''",
  "5fdf02cc-a9dd-4a73-90ae-fa060d5718fa":
    "5th floor The Ignacia Place 62 Sgt. Esguerra Ave. Diliman Quezon City,''",
  "aa92f0c3-0469-4404-9fce-ecf5c94427f1":
    "14th Floor DelRosarioLaw Centre 21st Drive Cor 20th Drive BGC Taguig,''",
  "c94788b7-8070-469f-b0e4-ba1cc99103db":
    "16/17F Milestone at Fifth Avenue 5th Avenue Bonifacio Global City Taguig City,''",
  "02774c57-bf66-43c9-8bfd-607f73c2d3b5":
    "The Enterprise Center Paseo de Roxas Legazpi Village Makati 1226 Metro Manila,'Enterprise Software and Information Solutions'",
  "aa696961-118e-4ced-bb57-4b23ca837e2e": "San Lazaro Compound Sta. Cruz Manila,''",
  "d06fba86-2143-43d6-98e8-92f124ceb0b1": "Gil J. Puyat Avenue Makati City Philippines,''",
  "784745e1-2c30-4030-a7dc-287a8ab8128c":
    "6/F Bitspace PDCP Bank Centre Bldg. Rufino cor. Leviste St. Salcedo Village Makati City,'Software Development'",
  "6b791ed6-f3f8-4384-bcb4-f90c76302b15":
    "4/F SEDCO I Bldg 120 Thailand cor. Legazpi Sts. Legaspi Village Makati City,''",
  "6e16bc24-ce4c-4e53-89b4-425812033323": "2401 Taft. Avenue Manila 0922,'Education'",
  "0f5bd4ca-f3c7-4326-b67f-d1cafd0f43db":
    "CP Garcia Street 1101 Quezon City,'General Management Consulting'",
  "a1dfe962-63f8-41d1-b75a-ad7da2cba9af":
    "18th Flr. Trident Tower 312 Sen Gil Puyat Ave. Makati City Philippines 1209,''",
  "aeb572e6-bff2-420b-b0ee-0714cfac6d4f":
    "Unit 1605-1610 Hanstons Square Building San Miguel Ave. Pasig City,''",
  "0f85f70a-a122-45f4-9944-c8b01ff19970":
    "#2 River Valey Road Lot C3-13 Brgy Punta Carmelray Industrial Park I Calamba City Laguna Philippines 4027.,''",
  "166fd5d2-e479-492c-acd9-1b2c2f763059":
    "9th Floor KMC Office V Corporate Center 125 L.P. Leviste Street Makati City,''",
  "43a5d797-087d-4f2e-b658-b43bfe03999e":
    "43B Noble Place Dasmarinas St. Corner Juan Luna St. Binondo Manila 1006,''",
  "9bb74de7-a141-43ae-ac54-8de8bb52d760":
    "20F Zuellig Building Makati Ave corner Paseo de Roxas Makati City,''",
  "b3ac215c-9b38-4e74-988a-18b893e92448": "50 Esteban Abada St. Loyola Heights Quezon City,''",
  "c28d0ca6-5f4d-4ec1-bb2b-257a042adf8e":
    "Zen Building Rm 201A 8352 Mayapis St. San Antonio Village Makati City,'Consulting Advisory'",
  "c5a3c5c2-92f7-4218-8793-836be9ed6352":
    "Level 10-1 One Global Place 25th St. and 5th Ave. Fort Bonifacio Taguig City,''",
};

export default function CompanyInfoCard({ id, name, contactPerson, email, phone }: Props) {
  const details = TODELETE[id]?.split(",");
  return (
    <div className="rounded-[0.33em] border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Company Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Address" value={details[0] ?? "-"} />
        <Detail
          label="Nature of Business"
          value={details.length ? details[1]?.replaceAll("'", "") : "-"}
        />
        <Detail label="Company Name" value={name} />
        <Detail label="Contact Person" value={contactPerson} />
        <Detail label="Phone" value={phone} />
      </div>
    </div>
  );
}
