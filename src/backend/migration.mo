import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type Doctor = {
    id : Nat;
    name : Text;
    specialty : Text;
    clinicName : Text;
    address : Text;
    areaTerritory : Text;
    phone : Text;
    email : Text;
    notes : Text;
  };

  type ProductOld = {
    id : Nat;
    name : Text;
    category : Text;
    description : Text;
    keyBenefits : Text;
    isActive : Bool;
  };

  type Product = {
    id : Nat;
    name : Text;
    category : Text;
    description : Text;
    keyBenefits : Text;
    isActive : Bool;
    image : ?Storage.ExternalBlob;
  };

  type VisitOutcome = {
    #positive;
    #neutral;
    #negative;
  };

  type Visit = {
    id : Nat;
    doctorId : Nat;
    date : Int;
    productsDiscussed : [Nat];
    callNotes : Text;
    outcome : VisitOutcome;
    nextVisitDate : ?Int;
  };

  type Reminder = {
    id : Nat;
    title : Text;
    note : Text;
    dueDate : Int;
    isDone : Bool;
    linkedDoctorId : ?Nat;
  };

  type OldActor = {
    doctors : Map.Map<Nat, Doctor>;
    products : Map.Map<Nat, ProductOld>;
    visits : Map.Map<Nat, Visit>;
    reminders : Map.Map<Nat, Reminder>;
    doctorOwners : Map.Map<Nat, Principal>;
    visitOwners : Map.Map<Nat, Principal>;
    reminderOwners : Map.Map<Nat, Principal>;
    nextDoctorId : Nat;
    nextProductId : Nat;
    nextVisitId : Nat;
    nextReminderId : Nat;
  };

  type NewActor = {
    doctors : Map.Map<Nat, Doctor>;
    products : Map.Map<Nat, Product>;
    visits : Map.Map<Nat, Visit>;
    reminders : Map.Map<Nat, Reminder>;
    doctorOwners : Map.Map<Nat, Principal>;
    visitOwners : Map.Map<Nat, Principal>;
    reminderOwners : Map.Map<Nat, Principal>;
    nextDoctorId : Nat;
    nextProductId : Nat;
    nextVisitId : Nat;
    nextReminderId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, ProductOld, Product>(
      func(_id, oldProduct) {
        { oldProduct with image = null };
      }
    );

    {
      old with
      products = newProducts;
    };
  };
};
