package com.smm.social_planner.controller;

import com.smm.social_planner.model.Brand;
import com.smm.social_planner.service.BrandService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    // Prende tutti i brand di un SMM
    @GetMapping("/smm/{smmId}")
    public List<Brand> getBrands(@PathVariable UUID smmId) {
        return brandService.getAllBrandsBySmm(smmId);
    }

    // Crea un nuovo brand (es. quando l'SMM acquisisce un nuovo cliente)
    @PostMapping
    public Brand createBrand(@RequestBody Brand brand) {
        return brandService.createBrand(brand.getName(), brand.getSmmId());
    }
}