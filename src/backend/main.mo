import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  public type Doctor = {
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

  public type Product = {
    id : Nat;
    name : Text;
    category : Text;
    description : Text;
    keyBenefits : Text;
    isActive : Bool;
    image : ?Storage.ExternalBlob;
  };

  public type VisitOutcome = {
    #positive;
    #neutral;
    #negative;
  };

  public type Visit = {
    id : Nat;
    doctorId : Nat;
    date : Int;
    productsDiscussed : [Nat];
    callNotes : Text;
    outcome : VisitOutcome;
    nextVisitDate : ?Int;
  };

  public type Reminder = {
    id : Nat;
    title : Text;
    note : Text;
    dueDate : Int;
    isDone : Bool;
    linkedDoctorId : ?Nat;
  };

  let doctors = Map.empty<Nat, Doctor>();
  let products = Map.empty<Nat, Product>();
  let visits = Map.empty<Nat, Visit>();
  let reminders = Map.empty<Nat, Reminder>();

  // Track ownership of data by MR
  let doctorOwners = Map.empty<Nat, Principal>();
  let visitOwners = Map.empty<Nat, Principal>();
  let reminderOwners = Map.empty<Nat, Principal>();

  var nextDoctorId = 1;
  var nextProductId = 1;
  var nextVisitId = 1;
  var nextReminderId = 1;

  let accessControlState = Authorization.initState();
  include MixinAuthorization(accessControlState);

  // User profile management
  public type UserProfile = {
    name : Text;
    employeeId : Text;
    territory : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  module Doctor {
    public func compareByName(doctor1 : Doctor, doctor2 : Doctor) : Order.Order {
      Text.compare(doctor1.name, doctor2.name);
    };
  };

  // Helper function to check if caller owns a doctor or is admin
  func canAccessDoctor(caller : Principal, doctorId : Nat) : Bool {
    if (Authorization.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (doctorOwners.get(doctorId)) {
      case (?owner) { Principal.equal(owner, caller) };
      case (null) { false };
    };
  };

  // Helper function to check if caller owns a visit or is admin
  func canAccessVisit(caller : Principal, visitId : Nat) : Bool {
    if (Authorization.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (visitOwners.get(visitId)) {
      case (?owner) { Principal.equal(owner, caller) };
      case (null) { false };
    };
  };

  // Helper function to check if caller owns a reminder or is admin
  func canAccessReminder(caller : Principal, reminderId : Nat) : Bool {
    if (Authorization.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (reminderOwners.get(reminderId)) {
      case (?owner) { Principal.equal(owner, caller) };
      case (null) { false };
    };
  };

  public shared ({ caller }) func upsertDoctor(doctor : Doctor) : async Nat {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage doctors");
    };

    // Check if updating existing doctor
    switch (doctors.values().find(func(d) { d.name == doctor.name })) {
      case (?existingDoctor) {
        // Verify ownership
        if (not canAccessDoctor(caller, existingDoctor.id)) {
          Runtime.trap("Unauthorized: Can only update your own doctors");
        };

        let updatedDoctor = {
          id = existingDoctor.id;
          name = doctor.name;
          specialty = doctor.specialty;
          clinicName = doctor.clinicName;
          address = doctor.address;
          areaTerritory = doctor.areaTerritory;
          phone = doctor.phone;
          email = doctor.email;
          notes = doctor.notes;
        };
        doctors.add(existingDoctor.id, updatedDoctor);
        existingDoctor.id;
      };
      case (null) {
        let newId = nextDoctorId;
        nextDoctorId += 1;
        let newDoctor = {
          id = newId;
          name = doctor.name;
          specialty = doctor.specialty;
          clinicName = doctor.clinicName;
          address = doctor.address;
          areaTerritory = doctor.areaTerritory;
          phone = doctor.phone;
          email = doctor.email;
          notes = doctor.notes;
        };
        doctors.add(newId, newDoctor);
        doctorOwners.add(newId, caller);
        newId;
      };
    };
  };

  public query ({ caller }) func getDoctor(id : Nat) : async ?Doctor {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view doctors");
    };

    if (not canAccessDoctor(caller, id)) {
      Runtime.trap("Unauthorized: Can only view your own doctors");
    };

    doctors.get(id);
  };

  public query ({ caller }) func getAllDoctors() : async [Doctor] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view doctors");
    };

    // Admins see all doctors, users see only their own
    let isAdmin = Authorization.isAdmin(accessControlState, caller);
    let filteredDoctors = if (isAdmin) {
      doctors.values().toArray();
    } else {
      doctors.values().filter(func(d) {
        canAccessDoctor(caller, d.id);
      }).toArray();
    };

    filteredDoctors.sort(Doctor.compareByName);
  };

  public shared ({ caller }) func deleteDoctor(id : Nat) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete doctors");
    };

    if (not canAccessDoctor(caller, id)) {
      Runtime.trap("Unauthorized: Can only delete your own doctors");
    };

    doctors.remove(id);
    doctorOwners.remove(id);
  };

  // Products are shared across all MRs, but only admins can modify
  public shared ({ caller }) func upsertProduct(product : Product) : async Nat {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage products");
    };

    switch (products.values().find(func(p) { p.name == product.name })) {
      case (?existingProduct) {
        let updatedProduct = {
          id = existingProduct.id;
          name = product.name;
          category = product.category;
          description = product.description;
          keyBenefits = product.keyBenefits;
          isActive = product.isActive;
          image = product.image;
        };
        products.add(existingProduct.id, updatedProduct);
        existingProduct.id;
      };
      case (null) {
        let newId = nextProductId;
        nextProductId += 1;
        let newProduct = {
          id = newId;
          name = product.name;
          category = product.category;
          description = product.description;
          keyBenefits = product.keyBenefits;
          isActive = product.isActive;
          image = product.image;
        };
        products.add(newId, newProduct);
        newId;
      };
    };
  };

  public query ({ caller }) func getProduct(id : Nat) : async ?Product {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    products.get(id);
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    products.values().toArray();
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(id);
  };

  public shared ({ caller }) func createVisit(visit : Visit) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create visits");
    };

    // Verify the doctor belongs to the caller
    if (not canAccessDoctor(caller, visit.doctorId)) {
      Runtime.trap("Unauthorized: Can only create visits for your own doctors");
    };

    let newId = nextVisitId;
    nextVisitId += 1;
    let newVisit = {
      id = newId;
      doctorId = visit.doctorId;
      date = visit.date;
      productsDiscussed = visit.productsDiscussed;
      callNotes = visit.callNotes;
      outcome = visit.outcome;
      nextVisitDate = visit.nextVisitDate;
    };
    visits.add(newId, newVisit);
    visitOwners.add(newId, caller);
  };

  public shared ({ caller }) func updateVisit(id : Nat, visit : Visit) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update visits");
    };

    if (not canAccessVisit(caller, id)) {
      Runtime.trap("Unauthorized: Can only update your own visits");
    };

    // Verify the doctor belongs to the caller
    if (not canAccessDoctor(caller, visit.doctorId)) {
      Runtime.trap("Unauthorized: Can only create visits for your own doctors");
    };

    let updatedVisit = {
      id = id;
      doctorId = visit.doctorId;
      date = visit.date;
      productsDiscussed = visit.productsDiscussed;
      callNotes = visit.callNotes;
      outcome = visit.outcome;
      nextVisitDate = visit.nextVisitDate;
    };
    visits.add(id, updatedVisit);
  };

  public query ({ caller }) func getVisit(id : Nat) : async ?Visit {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view visits");
    };

    if (not canAccessVisit(caller, id)) {
      Runtime.trap("Unauthorized: Can only view your own visits");
    };

    visits.get(id);
  };

  public query ({ caller }) func getVisitsByDoctor(doctorId : Nat) : async [Visit] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view visits");
    };

    if (not canAccessDoctor(caller, doctorId)) {
      Runtime.trap("Unauthorized: Can only view visits for your own doctors");
    };

    visits.values().filter(func(v) { v.doctorId == doctorId }).toArray();
  };

  public query ({ caller }) func getTodaysVisits() : async [Visit] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view visits");
    };

    let now = Time.now();
    let todayStart = now - (now % (24 * 60 * 60 * 1000000000));
    let todayEnd = todayStart + (24 * 60 * 60 * 1000000000);

    let isAdmin = Authorization.isAdmin(accessControlState, caller);
    visits.values().filter(func(v) {
      let isToday = v.date >= todayStart and v.date < todayEnd;
      let hasAccess = isAdmin or canAccessVisit(caller, v.id);
      isToday and hasAccess;
    }).toArray();
  };

  public shared ({ caller }) func deleteVisit(id : Nat) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete visits");
    };

    if (not canAccessVisit(caller, id)) {
      Runtime.trap("Unauthorized: Can only delete your own visits");
    };

    visits.remove(id);
    visitOwners.remove(id);
  };

  public shared ({ caller }) func createReminder(reminder : Reminder) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create reminders");
    };

    // If linked to a doctor, verify ownership
    switch (reminder.linkedDoctorId) {
      case (?doctorId) {
        if (not canAccessDoctor(caller, doctorId)) {
          Runtime.trap("Unauthorized: Can only create reminders for your own doctors");
        };
      };
      case (null) {};
    };

    let newId = nextReminderId;
    nextReminderId += 1;
    let newReminder = {
      id = newId;
      title = reminder.title;
      note = reminder.note;
      dueDate = reminder.dueDate;
      isDone = false;
      linkedDoctorId = reminder.linkedDoctorId;
    };
    reminders.add(newId, newReminder);
    reminderOwners.add(newId, caller);
  };

  public shared ({ caller }) func updateReminder(id : Nat, reminder : Reminder) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update reminders");
    };

    if (not canAccessReminder(caller, id)) {
      Runtime.trap("Unauthorized: Can only update your own reminders");
    };

    // If linked to a doctor, verify ownership
    switch (reminder.linkedDoctorId) {
      case (?doctorId) {
        if (not canAccessDoctor(caller, doctorId)) {
          Runtime.trap("Unauthorized: Can only create reminders for your own doctors");
        };
      };
      case (null) {};
    };

    let updatedReminder = {
      id = id;
      title = reminder.title;
      note = reminder.note;
      dueDate = reminder.dueDate;
      isDone = reminder.isDone;
      linkedDoctorId = reminder.linkedDoctorId;
    };
    reminders.add(id, updatedReminder);
  };

  public query ({ caller }) func getReminder(id : Nat) : async ?Reminder {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };

    if (not canAccessReminder(caller, id)) {
      Runtime.trap("Unauthorized: Can only view your own reminders");
    };

    reminders.get(id);
  };

  public query ({ caller }) func getAllReminders() : async [Reminder] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };

    let isAdmin = Authorization.isAdmin(accessControlState, caller);
    if (isAdmin) {
      reminders.values().toArray();
    } else {
      reminders.values().filter(func(r) {
        canAccessReminder(caller, r.id);
      }).toArray();
    };
  };

  public query ({ caller }) func getUpcomingReminders() : async [Reminder] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };

    let isAdmin = Authorization.isAdmin(accessControlState, caller);
    reminders.values().filter(func(r) {
      let isUpcoming = not r.isDone and r.dueDate > Time.now();
      let hasAccess = isAdmin or canAccessReminder(caller, r.id);
      isUpcoming and hasAccess;
    }).toArray();
  };

  public shared ({ caller }) func markReminderDone(id : Nat) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark reminders as done");
    };

    if (not canAccessReminder(caller, id)) {
      Runtime.trap("Unauthorized: Can only mark your own reminders as done");
    };

    switch (reminders.get(id)) {
      case (?reminder) {
        let updatedReminder = {
          id = reminder.id;
          title = reminder.title;
          note = reminder.note;
          dueDate = reminder.dueDate;
          isDone = true;
          linkedDoctorId = reminder.linkedDoctorId;
        };
        reminders.add(id, updatedReminder);
      };
      case (null) {
        Runtime.trap("Reminder not found");
      };
    };
  };

  public shared ({ caller }) func deleteReminder(id : Nat) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete reminders");
    };

    if (not canAccessReminder(caller, id)) {
      Runtime.trap("Unauthorized: Can only delete your own reminders");
    };

    reminders.remove(id);
    reminderOwners.remove(id);
  };

  public query ({ caller }) func getDashboardSummary() : async {
    totalDoctors : Nat;
    totalProducts : Nat;
    visitsThisMonth : Nat;
    pendingReminders : Nat;
  } {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard");
    };

    let isAdmin = Authorization.isAdmin(accessControlState, caller);

    // Calculate month boundaries
    let now = Time.now();
    let monthStart = now - (now % (30 * 24 * 60 * 60 * 1000000000));

    // Count doctors
    let totalDoctors = if (isAdmin) {
      doctors.size();
    } else {
      doctors.values().filter(func(d) {
        canAccessDoctor(caller, d.id);
      }).size();
    };

    // Count products (all users see all products)
    let totalProducts = products.size();

    // Count visits this month
    let visitsThisMonth = if (isAdmin) {
      visits.values().filter(func(v) {
        v.date >= monthStart;
      }).size();
    } else {
      visits.values().filter(func(v) {
        v.date >= monthStart and canAccessVisit(caller, v.id);
      }).size();
    };

    // Count pending reminders
    let pendingReminders = if (isAdmin) {
      reminders.values().filter(func(r) {
        not r.isDone;
      }).size();
    } else {
      reminders.values().filter(func(r) {
        not r.isDone and canAccessReminder(caller, r.id);
      }).size();
    };

    {
      totalDoctors = totalDoctors;
      totalProducts = totalProducts;
      visitsThisMonth = visitsThisMonth;
      pendingReminders = pendingReminders;
    };
  };
};
