package models

import "fmt"

func ToString(v interface{}) string {
	return fmt.Sprintf("%v", v)
}
