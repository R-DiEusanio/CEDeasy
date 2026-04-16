package com.smm.social_planner.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@DiscriminatorValue("SMM") // Quando il ruolo è SMM, Java usa questa classe
@Data
@EqualsAndHashCode(callSuper = true)
public class Smm extends Profile {
    // Qui potrai aggiungere campi specifici solo per il Social Media Manager
}