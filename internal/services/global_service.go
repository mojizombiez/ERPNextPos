package services

import (
	"MoltoPos/internal/models"
)

type GlobalService struct {
	OrderCommon models.OrderCommonModel
	Products    []models.Product
	Staffs      []models.Staff
}

var Global = &GlobalService{}

func (g *GlobalService) SetProducts(p []models.Product) {
	g.Products = p
}
