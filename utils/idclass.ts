import { config } from "dotenv";
config();

const isTest = process.env.isTest === "true";

class IDClass {

  ownershipID() {
    return "771514771295436851";
  }

  logChannel() {
    return isTest ? "1355635959860826348" : "1063870658183974912";
  }

  
  restrictedCategory() {
    return isTest ? "1421539470611583132" : "914422071130464276";
  }

  roleOwner() {
    return isTest ? "1421539465846853711" : "1207325026353938472";
  }

  roleARMSX2Team() {
    return isTest ? "1421539465846853708" : "1404607769289560187";
  }

  roleAdmin() {
    return isTest ? "1421539465846853703" : "914421546838261760";
  }

  roleMod() {
    return isTest ? "1421539465834533112" : "1063816443751313448";
  }

  roleHelper() {
    return isTest ? "1421539465834533110" : "1063817034510635109";
  }

  channelErrorLogs() {
    return isTest ? "1421556360029405274" : "1150726396067467285";
  }

  channelHoneypot() {
    return isTest ? "1421539469546356884" : "1420390624343101450";
  }

  DeltaBotz() {
    return isTest ? "1421541944990896148" : "1421136851158171680";
  }

  roleMods() {
  return [
    this.roleOwner(),
    this.roleARMSX2Team(),
    this.roleAdmin(),
    this.roleMod(),
    this.DeltaBotz()
  ];
}
  
}


// role/channelNAME() {
//  return isTest ? "TEST_ROLE/CHANNEL_ID" : "MAIN_ROLE_CHANNEL_ID";
//}

const idclass = new IDClass();
export default idclass;
